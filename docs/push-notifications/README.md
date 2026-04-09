# Push Notifications Feature (Appwrite + Firebase FCM)

This document explains the full implementation of offline chat push notifications in Chattrix.

## Goal

When User A sends a message to User B:

- If User B is online: deliver instantly via Socket.IO.
- If User B is offline: send a browser push notification via Appwrite Messaging (FCM provider).

## Architecture

1. Frontend gets browser notification permission.
2. Frontend gets FCM token using Firebase Web Messaging.
3. Frontend registers that token to backend.
4. Backend stores token in Appwrite as a push target.
5. Message send flow checks receiver online status using Socket.IO map.
6. If receiver is offline, backend calls Appwrite `createPush` to that receiver's targets.

## Files Added/Updated

### Backend

- `backend/utils/push/appwritePush.js`
  - Appwrite push clients
  - Push target register/update logic
  - Offline push sender
  - Push status and test helpers
  - Token transfer logic for shared browser account switching

- `backend/controllers/message.controller.js`
  - Added offline push trigger after message creation when receiver has no active socket

- `backend/controllers/user.controller.js`
  - `registerPushNotificationToken`
  - `sendPushTestNotification`
  - `getPushNotificationStatus`

- `backend/routes/user.routes.js`
  - `POST /api/users/push/register`
  - `POST /api/users/push/test`
  - `GET /api/users/push/test`
  - `GET /api/users/push/status`

### Frontend

- `frontend/src/services/firebaseMessaging.js`
  - Firebase app + messaging initialization

- `frontend/src/hooks/usePushNotifications.jsx`
  - Notification permission request
  - FCM token fetch and backend registration
  - Foreground notification UI
  - Per-user initialization guard

- `frontend/public/firebase-messaging-sw.js`
  - Background push notification display and click handling

- `frontend/src/App.jsx`
  - Hook bootstrap (`usePushNotifications`)

## Environment Variables

### Backend

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_PUSH_PROVIDER_ID` (example: `chattrix-fcm-prod`)
- `FRONTEND_URL`

### Frontend

- `VITE_BACKEND_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY`

## Testing Checklist

1. Login as receiver and allow notifications.
2. Open `GET /api/users/push/status`.
3. Verify `pushTargetCount >= 1`.
4. Run `GET /api/users/push/test` and verify popup appears.
5. Close receiver tab (offline).
6. Send message from sender.
7. Verify receiver gets push popup.

## Problems Faced During Implementation

1. JSX parse error in push hook
- Symptom: esbuild failed with `JSX syntax extension is not currently enabled`.
- Cause: JSX code existed in `.js` file.
- Fix: renamed `usePushNotifications.js` to `usePushNotifications.jsx`.

2. Firebase measurement ID used as VAPID key
- Symptom: token registration silently failed.
- Cause: `measurementId` (`G-...`) was used as `VITE_FIREBASE_VAPID_KEY`.
- Fix: used Web Push public key from Firebase Cloud Messaging tab.

3. Push registration error: user not found in Appwrite
- Symptom: backend log showed `User with the requested ID could not be found`.
- Cause: user/target state mismatch and collisions with existing Appwrite usage.
- Fix: improved Appwrite user ensure flow and robust retry logic.

4. No messages visible in Appwrite after opening test URL
- Symptom: no push events were created.
- Cause: test route was POST-only while user was opening in browser directly.
- Fix: added GET alias for `/api/users/push/test`.

5. Receiver had `pushTargetCount: 0` while sender worked
- Symptom: backend logged `No push targets found for offline receiver`.
- Cause: frontend init guard ran once globally, not per logged-in user.
- Fix: changed initialization to run per user ID.

6. Token conflict on shared browser account switching
- Symptom: one user could have target, second user stayed at zero.
- Cause: same browser FCM token already attached to previous account.
- Fix:
  - sent `previousUserId` from frontend
  - backend detaches token from old user
  - backend retries attaching token to current user
  - added broader candidate detachment fallback

## Operational Notes

- This feature provides browser push notifications, not phone SMS.
- Each user/device/browser must register its own push target.
- Keep backend secrets only in backend env files.
- Do not place private secrets in frontend env files.

## Quick Recovery Steps

If a user still has `pushTargetCount: 0`:

1. Ensure browser notifications are allowed for the site.
2. Re-login with that user account.
3. Check `/api/users/push/status`.
4. Trigger `/api/users/push/test`.
5. Review backend logs for push target create/transfer messages.
