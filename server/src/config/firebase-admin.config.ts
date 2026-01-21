import admin from "firebase-admin";
import path from "path";
import serviceAccount from "../config/reyuDiamondKey.json" with { type: "json" };

type Bucket = ReturnType<admin.storage.Storage["bucket"]>;

const serviceAccountPath = path.resolve(
  process.cwd(),
  "config/reyuDiamondKey.json"
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      serviceAccount as admin.ServiceAccount
    ),
    storageBucket: "reyu-diamond-app.appspot.com",
  });
}

export const db = admin.firestore();
export const fcm: admin.messaging.Messaging = admin.messaging();
export const bucket: Bucket = admin.storage().bucket();

export default admin;
