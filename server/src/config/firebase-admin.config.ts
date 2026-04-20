import admin from "firebase-admin";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = process.env["FIREBASE_SERVICE_ACCOUNT"]
  ? JSON.parse(process.env["FIREBASE_SERVICE_ACCOUNT"])
  : JSON.parse(
      fs.readFileSync(path.join(__dirname, "reyuDiamondKey.json"), "utf-8")
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
