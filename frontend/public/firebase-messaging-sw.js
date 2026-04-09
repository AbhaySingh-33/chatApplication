/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

const search = new URL(self.location).searchParams;

const firebaseConfig = {
  apiKey: search.get("apiKey") || "",
  authDomain: search.get("authDomain") || "",
  projectId: search.get("projectId") || "",
  storageBucket: search.get("storageBucket") || "",
  messagingSenderId: search.get("messagingSenderId") || "",
  appId: search.get("appId") || "",
};

if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "Chattrix";
    const body = payload?.notification?.body || payload?.data?.preview || "You have a new message.";
    const route = payload?.data?.route || "/";

    self.registration.showNotification(title, {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: payload?.data?.type || "chat_message",
      data: { route },
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: "open-chat", title: "Reply now" },
        { action: "dismiss", title: "Later" },
      ],
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const route = event.notification?.data?.route || "/";
  const looksLikeDomain = /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(String(route || "").trim());
  const absoluteUrl = /^https?:\/\//i.test(route)
    ? route
    : looksLikeDomain
      ? `https://${String(route).replace(/^\/+/, "")}`
      : new URL(route, self.location.origin).href;

  event.waitUntil(clients.openWindow(absoluteUrl));
});
