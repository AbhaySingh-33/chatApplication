import "dotenv/config";
import { Client, Messaging } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const messaging = new Messaging(client);
const providerId = process.env.APPWRITE_EMAIL_PROVIDER_ID;

const run = async () => {
  const list = await messaging.listMessages({});
  const emailMessages = (list?.messages || []).filter((m) => m.providerType === "email").slice(0, 5);

  console.log("emailMessagesFound=", emailMessages.length);

  for (const msg of emailMessages) {
    const messageId = msg.$id || msg.messageId;
    console.log("---");
    console.log("id=", messageId);
    console.log("status=", msg.status);
    console.log("deliveredTotal=", msg.deliveredTotal);
    console.log("scheduledAt=", msg.scheduledAt);
    console.log("deliveredAt=", msg.deliveredAt);

    try {
      const logs = await messaging.listMessageLogs({ messageId, total: true });
      const recent = (logs?.logs || []).slice(0, 5).map((entry) => ({
        status: entry.status,
        success: entry.success,
        providerType: entry.providerType,
        error: entry.error || null,
        targetId: entry.targetId,
      }));

      console.log("recentLogs=", JSON.stringify(recent, null, 2));
    } catch (error) {
      console.log("logReadError=", error.message);
    }
  }
};

run().catch((error) => {
  console.error("messageReadError=", error.message);
  process.exit(1);
});

if (providerId) {
  const runProviderLogs = async () => {
    try {
      const providerLogs = await messaging.listProviderLogs({ providerId, total: true });
      const recentProviderLogs = (providerLogs?.logs || []).slice(0, 8).map((entry) => ({
        status: entry.status,
        success: entry.success,
        error: entry.error || null,
        messageId: entry.messageId,
        targetId: entry.targetId,
        providerType: entry.providerType,
      }));
      console.log("providerLogs=", JSON.stringify(recentProviderLogs, null, 2));
    } catch (error) {
      console.log("providerLogReadError=", error.message);
    }
  };

  runProviderLogs().catch((error) => {
    console.log("providerLogReadError=", error.message);
  });
}
