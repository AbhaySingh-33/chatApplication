import { initializeApp } from "firebase/app";
import { getMessaging, isSupported, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let firebaseApp;
let messagingInstance;

const hasRequiredFirebaseConfig = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );

export const canUseFirebaseMessaging = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (!hasRequiredFirebaseConfig()) {
    return false;
  }

  return isSupported();
};

export const getFirebaseMessaging = async () => {
  const supported = await canUseFirebaseMessaging();
  if (!supported) {
    return null;
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp);
  }

  return messagingInstance;
};

export const listenForegroundMessages = async (handler) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging || typeof handler !== "function") {
    return () => {};
  }

  return onMessage(messaging, handler);
};

export { firebaseConfig };
