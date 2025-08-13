# Firebase Functionality Disabled

## Overview
Firebase functionality has been temporarily disabled in this project as it's not needed for current development.

## What was disabled:
1. **Firebase Cloud Messaging (FCM)** - Push notifications
2. **FCM Token Management** - Token storage and updates during login
3. **Firebase Admin SDK** - Server-side Firebase operations

## Files Modified:
- `src/firebase/index.js` - Firebase initialization commented out, replaced with mock
- `src/helper/notification.js` - Notification sending disabled, replaced with console logs
- `src/controllers/auth/loginController.js` - FCM token updates disabled

## What still works:
- **Local Notifications** - Notifications are still stored in the database
- **Notification API** - All notification endpoints still function
- **Notification History** - Users can still view their notification history

## To re-enable Firebase:
1. Uncomment the Firebase initialization in `src/firebase/index.js`
2. Uncomment the notification sending in `src/helper/notification.js`
3. Uncomment FCM token handling in `src/controllers/auth/loginController.js`
4. Ensure `src/firebase/serviceAccountKeys.json` contains valid credentials

## Current Behavior:
- When notifications would be sent, a console log appears instead
- FCM tokens are no longer stored or updated
- All other functionality remains unchanged 