import { fcm } from "../config/firebase-admin.config.js";
import User from "../models/User.model.js";

export const notifyAdminsForKyc = async (userId: string) => {
    const admins = await User.find({role: "admin", fcmToken: { $ne: null }})

    for(const admin of admins) {
        if(admin.fcmToken) {
            await fcm.send({
                token: admin.fcmToken,
                notification: {
                    title: "New KYC Submission",
                    body: `User with ID ${userId} has submitted KYC documents.`,
                },
                data: {
                    type: "KYC_PENDING",
                    userId
                }
            });
        }
    }
}