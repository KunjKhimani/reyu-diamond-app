import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./dist/config/reyuDiamondKey.json", "utf-8")
);

type Bucket = ReturnType<admin.storage.Storage["bucket"]>;

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
