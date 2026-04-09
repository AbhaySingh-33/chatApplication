import { Client, ID, Messaging, Users } from "node-appwrite";

const APPWRITE_TARGET_TYPE_PUSH = "push";

let appwriteClients;

const normalizeToken = (value) => String(value || "").trim();

const isNotFoundError = (error) => error?.code === 404 || error?.response?.status === 404;
const isConflictError = (error) => error?.code === 409 || error?.response?.status === 409;

const toAppwriteUserId = (mongoUserId) => {
  const raw = String(mongoUserId || "").trim();
  return `chatusr_${raw}`;
};

const toDeviceTargetId = (token) => {
  const raw = normalizeToken(token);
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "");
  const seed = compact.slice(-16);
  return `pushtgt_${seed}${ID.unique().replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}`;
};

const getConfig = () => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const providerId = process.env.APPWRITE_PUSH_PROVIDER_ID || "";

  return {
    endpoint,
    projectId,
    apiKey,
    providerId,
    enabled: Boolean(endpoint && projectId && apiKey),
  };
};

const getAppwriteClients = () => {
  if (appwriteClients) {
    return appwriteClients;
  }

  const { endpoint, projectId, apiKey, enabled } = getConfig();
  if (!enabled) {
    throw new Error("Appwrite push is not configured");
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

  appwriteClients = {
    users: new Users(client),
    messaging: new Messaging(client),
  };

  return appwriteClients;
};

const ensureAppwriteUser = async ({ users, mongoUser }) => {
  const userId = toAppwriteUserId(mongoUser?._id);

  try {
    await users.get({ userId });
    return userId;
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }
  }

  // Use a synthetic email so push users never collide with Appwrite email-delivery users.
  const safeEmail = `push_${String(mongoUser?._id || "unknown").trim().toLowerCase()}@push.chattrix.local`;
  const displayName = String(mongoUser?.fullName || mongoUser?.username || "CHATTRIX User").slice(0, 128);

  try {
    await users.create({
      userId,
      email: safeEmail,
      password: `${ID.unique()}Aa1!`,
      name: displayName,
    });
  } catch (error) {
    if (!isConflictError(error)) {
      throw error;
    }
  }

  return userId;
};

const findPushTargetByToken = (targets, token) => {
  const normalized = normalizeToken(token);
  return (targets || []).find(
    (target) =>
      target?.providerType === APPWRITE_TARGET_TYPE_PUSH &&
      normalizeToken(target?.identifier) === normalized
  );
};

export const isAppwritePushConfigured = () => getConfig().enabled;

const detachTokenFromUser = async ({ users, mongoUserId, pushToken }) => {
  if (!mongoUserId) {
    return false;
  }

  const userId = toAppwriteUserId(mongoUserId);
  let listed;
  try {
    listed = await users.listTargets({ userId });
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }
    throw error;
  }

  const match = findPushTargetByToken(listed?.targets || [], pushToken);
  if (!match?.$id) {
    return false;
  }

  await users.deleteTarget({ userId, targetId: match.$id });
  console.log(`Detached push token from previous user ${String(mongoUserId)} (${match.$id})`);
  return true;
};

export const registerPushTarget = async ({
  mongoUser,
  pushToken,
  deviceName,
  previousMongoUserId,
  detachCandidateMongoUserIds = [],
}) => {
  const token = normalizeToken(pushToken);
  if (!token) {
    throw new Error("Missing push token");
  }

  const { providerId } = getConfig();
  const { users } = getAppwriteClients();
  const userId = await ensureAppwriteUser({ users, mongoUser });

  let allTargets;
  try {
    allTargets = await users.listTargets({ userId });
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    // Self-heal if Appwrite user was removed manually after previous registration.
    await ensureAppwriteUser({ users, mongoUser });
    allTargets = await users.listTargets({ userId });
  }
  const existing = findPushTargetByToken(allTargets?.targets || [], token);

  if (existing?.$id) {
    const updatePayload = {
      userId,
      targetId: existing.$id,
      identifier: token,
      name: String(deviceName || existing.name || "Chattrix Web Device").slice(0, 128),
    };
    if (providerId) {
      updatePayload.providerId = providerId;
    }

    await users.updateTarget(updatePayload);
    console.log(`Push target updated for user ${String(mongoUser?._id)} (${existing.$id})`);
    return existing.$id;
  }

  const createPayload = {
    userId,
    targetId: toDeviceTargetId(token),
    providerType: APPWRITE_TARGET_TYPE_PUSH,
    identifier: token,
    name: String(deviceName || "Chattrix Web Device").slice(0, 128),
  };

  if (providerId) {
    createPayload.providerId = providerId;
  }

  try {
    const created = await users.createTarget(createPayload);
    console.log(`Push target created for user ${String(mongoUser?._id)} (${created?.$id || createPayload.targetId})`);
    return created?.$id || createPayload.targetId;
  } catch (error) {
    if (!isConflictError(error)) {
      throw error;
    }

    // Common when same browser token was linked to a previous account on this device.
    const candidateIds = [
      previousMongoUserId,
      ...detachCandidateMongoUserIds,
    ].filter(Boolean);

    for (const candidateId of candidateIds) {
      if (String(candidateId) === String(mongoUser?._id)) {
        continue;
      }

      const detached = await detachTokenFromUser({
        users,
        mongoUserId: candidateId,
        pushToken: token,
      });

      if (!detached) {
        continue;
      }

      const retried = await users.createTarget({
        ...createPayload,
        targetId: toDeviceTargetId(token),
      });
      console.log(
        `Push target transferred to user ${String(mongoUser?._id)} (${retried?.$id || "unknown"})`
      );
      return retried?.$id || createPayload.targetId;
    }

    if (candidateIds.length) {
      console.log("Push token conflict persisted after detachment attempts");
    } else {
      console.log("Push token conflict detected but no candidate users provided");
    }
    const refreshed = await users.listTargets({ userId });
    const fallback = findPushTargetByToken(refreshed?.targets || [], token);
    if (fallback?.$id) {
      return fallback.$id;
    }

    throw new Error("Unable to resolve push target for token");
  }
};

const toMessagePreview = (messageText) => {
  const compact = String(messageText || "").replace(/\s+/g, " ").trim();
  if (!compact) {
    return "sent you a new message";
  }
  return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
};

const isLocalhostUrl = (value) => /localhost|127\.0\.0\.1/i.test(String(value || ""));
const hasHttpScheme = (value) => /^https?:\/\//i.test(String(value || ""));
const looksLikeDomain = (value) => /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(String(value || "").trim());

const getFrontendBaseUrl = () => {
  const value = String(
    process.env.PUSH_NOTIFICATION_CLICK_URL || process.env.FRONTEND_URL || ""
  )
    .trim()
    .replace(/\/$/, "");

  if (!value) {
    return "";
  }

  const normalizedValue = hasHttpScheme(value)
    ? value
    : looksLikeDomain(value)
      ? `https://${value}`
      : value;

  // In production, never bake localhost URLs into push notifications.
  if (process.env.NODE_ENV === "production" && isLocalhostUrl(normalizedValue)) {
    console.warn(
      "Push click base URL is localhost in production. Falling back to relative route."
    );
    return "";
  }

  return normalizedValue.replace(/\/$/, "");
};

const toNotificationUrl = (route = "/") => {
  const rawRoute = String(route || "/").trim();
  if (!rawRoute) {
    return "/";
  }

  if (/^https?:\/\//i.test(rawRoute)) {
    return rawRoute;
  }

  if (looksLikeDomain(rawRoute)) {
    return `https://${rawRoute.replace(/^\/+/, "")}`;
  }

  const normalizedRoute = rawRoute.startsWith("/") ? rawRoute : `/${rawRoute}`;
  const baseUrl = getFrontendBaseUrl();
  if (!baseUrl) {
    return normalizedRoute;
  }

  return `${baseUrl}${normalizedRoute}`;
};

export const sendOfflineMessagePush = async ({ receiver, sender, messageText, chatRoute }) => {
  if (!receiver?._id) {
    return;
  }

  const { users, messaging } = getAppwriteClients();
  const receiverAppwriteId = toAppwriteUserId(receiver._id);

  let listed;
  try {
    listed = await users.listTargets({ userId: receiverAppwriteId });
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }
    throw error;
  }
  const pushTargets = (listed?.targets || []).filter(
    (target) => target?.providerType === APPWRITE_TARGET_TYPE_PUSH
  );

  if (!pushTargets.length) {
    console.log(`No push targets found for offline receiver ${String(receiver?._id)}`);
    return;
  }

  const senderName = String(sender?.fullName || sender?.username || "Someone");
  const preview = toMessagePreview(messageText);

  const frontendUrl = getFrontendBaseUrl();
  const notificationUrl = toNotificationUrl(chatRoute || "/");

  await messaging.createPush({
    messageId: ID.unique(),
    title: "Chattrix",
    body: `${senderName} sent: ${preview}`,
    targets: pushTargets.map((target) => target.$id),
    data: {
      type: "chat_message",
      senderId: String(sender?._id || ""),
      senderName,
      route: notificationUrl,
      preview,
    },
    action: notificationUrl,
    ...(frontendUrl ? { icon: `${frontendUrl}/logo.png` } : {}),
    tag: `chat-${String(sender?._id || "unknown")}`,
    draft: false,
    contentAvailable: true,
    priority: "high",
  });

  console.log(
    `Offline push queued for receiver ${String(receiver?._id)} with ${pushTargets.length} target(s)`
  );
};

export const sendTestPushToUser = async ({ mongoUserId, title, body, route = "/" }) => {
  const { users, messaging } = getAppwriteClients();
  const userId = toAppwriteUserId(mongoUserId);

  const listed = await users.listTargets({ userId });
  const pushTargets = (listed?.targets || []).filter(
    (target) => target?.providerType === APPWRITE_TARGET_TYPE_PUSH
  );

  if (!pushTargets.length) {
    return { delivered: false, reason: "no-targets" };
  }

  const notificationUrl = toNotificationUrl(route);

  const message = await messaging.createPush({
    messageId: ID.unique(),
    title: title || "Chattrix Test",
    body: body || "Push is configured correctly.",
    targets: pushTargets.map((target) => target.$id),
    data: {
      type: "push_test",
      route: notificationUrl,
    },
    action: notificationUrl,
    tag: "chattrix-push-test",
    draft: false,
    priority: "high",
  });

  return {
    delivered: true,
    targets: pushTargets.length,
    messageId: message?.$id || message?.messageId || null,
    provider: "appwrite-fcm",
  };
};

export const getPushStatusForUser = async ({ mongoUserId }) => {
  const { users } = getAppwriteClients();
  const userId = toAppwriteUserId(mongoUserId);

  try {
    const listed = await users.listTargets({ userId });
    const pushTargets = (listed?.targets || []).filter(
      (target) => target?.providerType === APPWRITE_TARGET_TYPE_PUSH
    );

    return {
      exists: true,
      appwriteUserId: userId,
      pushTargetCount: pushTargets.length,
      pushTargets: pushTargets.map((target) => ({
        id: target?.$id,
        name: target?.name,
        providerType: target?.providerType,
      })),
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return {
        exists: false,
        appwriteUserId: userId,
        pushTargetCount: 0,
        pushTargets: [],
      };
    }

    throw error;
  }
};

export const resetPushClients = () => {
  appwriteClients = null;
};
