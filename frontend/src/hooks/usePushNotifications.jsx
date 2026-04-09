import { useEffect, useRef } from "react";
import { getToken } from "firebase/messaging";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { canUseFirebaseMessaging, firebaseConfig, getFirebaseMessaging, listenForegroundMessages } from "../services/firebaseMessaging";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const DEFAULT_CLICK_BASE_URL = "https://chat-application-bice-ten.vercel.app";

const hasHttpScheme = (value) => /^https?:\/\//i.test(String(value || ""));
const isLocalhostUrl = (value) => /localhost|127\.0\.0\.1/i.test(String(value || ""));
const looksLikeDomain = (value) => /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(String(value || "").trim());

const getClickBaseUrl = () => {
  const fromEnv = String(import.meta.env.VITE_PUSH_CLICK_BASE_URL || "").trim();
  const fallback = DEFAULT_CLICK_BASE_URL;

  const raw = fromEnv || fallback;
  const withScheme = hasHttpScheme(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  return withScheme.replace(/\/$/, "");
};

const resolveNotificationRoute = (route) => {
  const raw = String(route || "/").trim();
  const baseUrl = getClickBaseUrl();

  if (!raw) {
    return `${baseUrl}/`;
  }

  if (hasHttpScheme(raw)) {
    if (isLocalhostUrl(raw)) {
      const pathname = new URL(raw).pathname || "/";
      return `${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    }
    return raw;
  }

  if (looksLikeDomain(raw)) {
    return `https://${raw.replace(/^\/+/, "")}`;
  }

  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${baseUrl}${normalizedPath}`;
};

const toPreviewText = (payload) => {
  const body = payload?.notification?.body || payload?.data?.preview || "You have a new message on Chattrix.";
  return String(body);
};

const registerPushToken = async ({ token }) => {
  const previousUserId = localStorage.getItem("chattrix_push_owner_user") || null;

  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/push/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      token,
      deviceName: "Chattrix Web",
      previousUserId,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to register push token");
  }

  return response.json();
};

const registerMessagingServiceWorker = async () => {
  const query = new URLSearchParams({
    apiKey: firebaseConfig.apiKey || "",
    authDomain: firebaseConfig.authDomain || "",
    projectId: firebaseConfig.projectId || "",
    storageBucket: firebaseConfig.storageBucket || "",
    messagingSenderId: firebaseConfig.messagingSenderId || "",
    appId: firebaseConfig.appId || "",
  });

  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query.toString()}`);
};

const showForegroundPopup = (payload) => {
  const senderName = payload?.data?.senderName || "New message";
  const preview = toPreviewText(payload);

  toast.custom(
    (t) => (
      <div
        className={`w-[360px] max-w-[92vw] rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-2xl ring-1 ring-cyan-300/20 transition-all ${
          t.visible ? "animate-enter" : "animate-leave"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-xl">💬</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Chattrix Alert</p>
            <p className="truncate text-sm font-semibold text-white">{senderName}</p>
            <p className="mt-1 line-clamp-2 text-xs text-slate-300">{preview}</p>
          </div>
        </div>
      </div>
    ),
    { duration: 5500, position: "top-right" }
  );
};

const usePushNotifications = () => {
  const { authUser } = useAuthContext();
  const initializedForUserRef = useRef(null);

  useEffect(() => {
    if (!authUser?._id) {
      initializedForUserRef.current = null;
      return;
    }

    if (initializedForUserRef.current === authUser._id) {
      return;
    }

    initializedForUserRef.current = authUser._id;

    const run = async () => {
      try {
        if (!VAPID_KEY) {
          return;
        }

        if (!(await canUseFirebaseMessaging())) {
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          return;
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) {
          return;
        }

        const registration = await registerMessagingServiceWorker();
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          return;
        }

        const tokenStorageKey = `chattrix_push_token_${authUser._id}`;
        await registerPushToken({ token });
        localStorage.setItem(tokenStorageKey, token);
        localStorage.setItem("chattrix_push_owner_user", authUser._id);
      } catch (error) {
        console.error("Push notification initialization failed:", error.message);
      }
    };

    run();
  }, [authUser?._id]);

  useEffect(() => {
    if (!authUser?._id) {
      return;
    }

    let unsubscribe = () => {};

    const bind = async () => {
      unsubscribe = await listenForegroundMessages((payload) => {
        showForegroundPopup(payload);

        if (Notification.permission === "granted") {
          const title = payload?.notification?.title || "Chattrix";
          const body = toPreviewText(payload);
          const route = resolveNotificationRoute(payload?.data?.route || "/");
          const notification = new Notification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            tag: payload?.data?.type || "chat_message",
            data: { route },
          });

          notification.onclick = () => {
            window.focus();
            window.location.href = route;
            notification.close();
          };
        }
      });
    };

    bind();

    return () => {
      unsubscribe();
    };
  }, [authUser?._id]);
};

export default usePushNotifications;
