// Firebase functionality disabled - not needed for now
// import firebase from "firebase-admin";
// import { readFileSync } from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Construct the absolute path to the service account keys file
// const serviceAccountKeysPath = path.resolve(
//   __dirname,
//   "../firebase/serviceAccountKeys.json",
// );

// // Read the service account keys file
// const serviceAccountKeys = readFileSync(serviceAccountKeysPath);
// firebase.initializeApp({
//   credential: firebase.credential.cert(JSON.parse(serviceAccountKeys)),
// });

// export default firebase;

// Temporary mock export to prevent import errors
const mockFirebase = {
  messaging: () => ({
    send: async () => {
      // console.log('Firebase messaging disabled - notification not sent');
      return { success: false, message: 'Firebase disabled' };
    }
  })
};

export default mockFirebase;
