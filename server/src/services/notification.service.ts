import { fcm } from "../config/firebase-admin.config.js";
import User from "../models/User.model.js";
import { Auction } from "../models/Auction.model.js";
import Inventory from "../models/Inventory.model.js";
import type { IDeal } from "../models/Deal.model.js";
import type { IInventory } from "../models/Inventory.model.js";
import Requirement from "../models/requirement.model.js";
import { Advertisement } from "../models/Advertisement.model.js";
import type { ISystemLog } from "../models/SystemLog.model.js";
import Deal from "../models/Deal.model.js";
import Notification from "../models/Notification.model.js";
import { sendNotificationViaQueue } from "../queues/notification.queue.js";

export const notifyAdminsForKyc = async (userId: string) => {
  const notification = {
    title: "New KYC Submission",
    body: `User with ID ${userId} submitted KYC.`,
  };
  const data = {
    type: "KYC_PENDING",
    userId
  };

  await sendFcmToAdmins(notification, data);
  await saveNotificationToAdmins(notification, data);
};

export const notifyAuctionOwnerNewBid = async ({
  auctionId,
  buyerName,
  bidAmount,
}: {
  auctionId: string;
  buyerName: string;
  bidAmount: number;
}) => {
  try {
    const auction = await Auction.findById(auctionId).select("inventoryId");
    if (!auction) return;

    const inventory = await Inventory.findById(auction.inventoryId).select("sellerId");
    if (!inventory) return;

    const ownerId = inventory.sellerId.toString();
    const notification = {
      title: "New Bid Received!",
      body: `${buyerName} placed a bid of ₹${bidAmount} on your auction.`,
    };
    const data = {
      type: "NEW_BID",
      auctionId,
      bidAmount: String(bidAmount),
    };

    await sendFcmToUser(ownerId, notification, data);
    await saveNotification(ownerId, notification, data);

    console.log(`New bid notification sent to auction owner ${ownerId}`);
  } catch (error: any) {
    console.error("Error in notifyAuctionOwnerNewBid:", error.message);
  }
};

export const notifyDealCreated = async (deal: IDeal) => {
  const sellerId = deal.sellerId.toString();
  const buyerId = deal.buyerId.toString();
  const dealId = deal._id.toString();

  const users = [
    { id: sellerId, title: "Deal Created", body: `A deal has been created for your bid (Deal ID: ${dealId}). Awaiting payment from buyer.` },
    { id: buyerId, title: "Deal Created", body: `Your bid was accepted! A deal has been created (Deal ID: ${dealId}).` }
  ];

  for (const item of users) {
    const notification = { title: item.title, body: item.body };
    const data = { type: "DEAL_CREATED", dealId };

    await sendFcmToUser(item.id, notification, data);
    await saveNotification(item.id, notification, data);
  }
};

export const notifyAllUsersNewAuction = async (auctionId: string) => {
  try {
    const auction = await Auction.findById(auctionId).populate("inventoryId");
    if (!auction) return;

    const inv = auction.inventoryId as any;
    const shape = inv?.shape ?? "N/A";
    const carat = inv?.carat ?? "N/A";
    const color = inv?.color ?? "N/A";
    const clarity = inv?.clarity ?? "N/A";
    const lab = inv?.lab ?? "";
    const location = inv?.location ?? "";

    const start = new Date(auction.startDate).toLocaleDateString("en-IN");
    const end = new Date(auction.endDate).toLocaleDateString("en-IN");

    const title = "🔨 New Auction Live!";
    const body = `${shape} ${carat}ct | ${color} ${clarity}${lab ? ` | ${lab}` : ""}${location ? ` | ${location}` : ""} — Base: ₹${auction.basePrice} | ${start} → ${end}`;

    const data: Record<string, string> = {
      type: "NEW_AUCTION",
      auctionId: auctionId,
      basePrice: String(auction.basePrice),
      startDate: auction.startDate.toISOString(),
      endDate: auction.endDate.toISOString(),
      shape,
      carat: String(carat),
      color,
      clarity,
      lab,
      location,
    };

    const ownerId = inv?.sellerId?.toString();
    const users = await User.find({
      ...(ownerId ? { _id: { $ne: ownerId } } : {}),
    }).select("_id");

    for (const user of users) {
      const userId = user._id.toString();
      await sendFcmToUser(userId, { title, body }, data);
      await saveNotification(userId, { title, body }, data);
    }
  } catch (error: any) {
    console.error("Error in notifyAllUsersNewAuction:", error.message);
  }
};

export const checkAndNotifyRequirements = async (inventory: IInventory) => {
  try {
    const matchingRequirements = await Requirement.find({
      shape: inventory.shape,
      color: inventory.color,
      clarity: inventory.clarity,
      carat: { $lte: inventory.carat },
      budget: { $gte: inventory.price }
    }).select("userId");

    for (const req of matchingRequirements) {
      const userId = req.userId.toString();
      const notification = {
        title: "New Inventory Match!",
        body: `A new diamond matches your requirement: ${inventory.shape} ${inventory.carat}ct ${inventory.color} ${inventory.clarity}`,
      };
      const data = {
        type: "INVENTORY_MATCH",
        inventoryId: inventory._id.toString(),
        requirementId: req._id.toString()
      };

      await sendFcmToUser(userId, notification, data);
      await saveNotification(userId, notification, data);
    }
  } catch (error: any) {
    console.error("Error in checkAndNotifyRequirements:", error);
  }
};

// ─── Helper: save notification to DB ──────────────────────────────────────────
const saveNotification = async (
  recipientId: string,
  notification: { title: string; body: string },
  data: Record<string, string>,
  senderId?: string
) => {
  try {
    const notificationObj: any = {
      recipient: recipientId,
      title: notification.title,
      body: notification.body,
      data,
      type: data.type || "GENERAL",
    };
    if (senderId) notificationObj.sender = senderId;
    await Notification.create(notificationObj);
  } catch (error) {
    console.error("Error saving notification to DB:", error);
  }
};

// ─── Helper: send FCM to a single user, clean up stale token on failure ───────
const sendFcmToUser = async (
  userId: string,
  notification: { title: string; body: string },
  data: Record<string, string>
) => {
  try {
    await sendNotificationViaQueue({
      userId,
      notification,
      data,
      type: "SINGLE"
    });
  } catch (error) {
    console.error(`Error enqueuing FCM for user ${userId}:`, error);
  }
};

// ─── Helper: save notification to all admins ──────────────────────────────────
const saveNotificationToAdmins = async (
  notification: { title: string; body: string },
  data: Record<string, string>,
  senderId?: string
) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await saveNotification(admin._id.toString(), notification, data, senderId);
    }
  } catch (error) {
    console.error("Error saving notification to admins:", error);
  }
};

// ─── Helper: send FCM to all admins ──────────────────────────────────────────
const sendFcmToAdmins = async (
  notification: { title: string; body: string },
  data: Record<string, string>
) => {
  try {
    await sendNotificationViaQueue({
      notification,
      data,
      type: "ADMINS"
    });
  } catch (error) {
    console.error("Error enqueuing FCM for admins:", error);
  }
};

// ─── Stripe Notifications ─────────────────────────────────────────────────────

/**
 * /payment-intent — buyer initiated payment.
 * Notify: seller + all admins.
 */
export const notifyPaymentInitiated = async (dealId: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const data: Record<string, string> = { type: "PAYMENT_INITIATED", dealId };

    const notification = {
      title: "💳 Payment Initiated",
      body: `Buyer has initiated payment of ₹${deal.agreedAmount} for Deal #${dealId}. Funds will be held in escrow.`,
    };

    await sendFcmToUser(sellerId, notification, data);
    await saveNotification(sellerId, notification, data);

    const adminNotification = {
      title: "💳 Payment Initiated",
      body: `Payment of ₹${deal.agreedAmount} initiated for Deal #${dealId}.`,
    };

    await sendFcmToAdmins(adminNotification, data);
    await saveNotificationToAdmins(adminNotification, data);
  } catch (err: any) {
    console.error("notifyPaymentInitiated error:", err.message);
  }
};

/**
 * /buyer-confirm — buyer confirmed delivery, escrow released to seller.
 * Notify: seller + all admins.
 */
export const notifyEscrowReleased = async (dealId: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const data: Record<string, string> = { type: "ESCROW_RELEASED", dealId };

    const notification = {
      title: "🎉 Payment Released!",
      body: `Buyer confirmed delivery. ₹${deal.agreedAmount} has been released to your Stripe account for Deal #${dealId}.`,
    };

    await sendFcmToUser(sellerId, notification, data);
    await saveNotification(sellerId, notification, data);

    const adminNotification = {
      title: "🎉 Escrow Released",
      body: `Buyer confirmed delivery for Deal #${dealId}. ₹${deal.agreedAmount} released to seller.`,
    };

    await sendFcmToAdmins(adminNotification, data);
    await saveNotificationToAdmins(adminNotification, data);
  } catch (err: any) {
    console.error("notifyEscrowReleased error:", err.message);
  }
};

/**
 * /refund-escrow — escrow refunded (seller/admin triggered).
 * Notify: seller + buyer + all admins.
 */
export const notifyEscrowRefunded = async (dealId: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const buyerId = deal.buyerId.toString();
    const data: Record<string, string> = { type: "ESCROW_REFUNDED", dealId };

    const buyerNotification = {
      title: "💰 Refund Processed",
      body: `Your escrow payment of ₹${deal.agreedAmount} for Deal #${dealId} has been refunded.`,
    };
    await sendFcmToUser(buyerId, buyerNotification, data);
    await saveNotification(buyerId, buyerNotification, data);

    const sellerNotification = {
      title: "🔄 Deal Refunded",
      body: `Escrow of ₹${deal.agreedAmount} for Deal #${dealId} has been refunded to the buyer.`,
    };
    await sendFcmToUser(sellerId, sellerNotification, data);
    await saveNotification(sellerId, sellerNotification, data);

    const adminNotification = {
      title: "🔄 Escrow Refunded",
      body: `Escrow refund processed for Deal #${dealId}. Amount: ₹${deal.agreedAmount}.`,
    };
    await sendFcmToAdmins(adminNotification, data);
    await saveNotificationToAdmins(adminNotification, data);
  } catch (err: any) {
    console.error("notifyEscrowRefunded error:", err.message);
  }
};

/**
 * /dispute — dispute raised.
 * Notify: seller + buyer + all admins.
 */
export const notifyDisputeRaised = async (dealId: string, reason: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const buyerId = deal.buyerId.toString();
    const data: Record<string, string> = { type: "DISPUTE_RAISED", dealId };

    const notification = {
      title: "⚠️ Dispute Raised",
      body: `A dispute has been raised for Deal #${dealId}. Reason: ${reason}`,
    };

    await sendFcmToUser(sellerId, notification, data);
    await saveNotification(sellerId, notification, data);
    await sendFcmToUser(buyerId, notification, data);
    await saveNotification(buyerId, notification, data);
    await sendFcmToAdmins(notification, data);
    await saveNotificationToAdmins(notification, data);
  } catch (err: any) {
    console.error("notifyDisputeRaised error:", err.message);
  }
};

/**
 * /resolve-dispute — dispute resolved.
 * Notify: seller + buyer.
 */
export const notifyDisputeResolved = async (dealId: string, resolution: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const buyerId = deal.buyerId.toString();
    const data: Record<string, string> = { type: "DISPUTE_RESOLVED", dealId };

    const notification = {
      title: "✅ Dispute Resolved",
      body: `The dispute for Deal #${dealId} has been resolved. Resolution: ${resolution}`,
    };

    await sendFcmToUser(sellerId, notification, data);
    await saveNotification(sellerId, notification, data);
    await sendFcmToUser(buyerId, notification, data);
    await saveNotification(buyerId, notification, data);
  } catch (err: any) {
    console.error("notifyDisputeResolved error:", err.message);
  }
};

/**
 * /cancel — deal cancelled.
 * Notify: seller + buyer + admin.
 */
export const notifyDealCancelled = async (dealId: string) => {
  try {
    const deal = await Deal.findById(dealId);
    if (!deal) return;

    const sellerId = deal.sellerId.toString();
    const buyerId = deal.buyerId.toString();
    const data: Record<string, string> = { type: "DEAL_CANCELLED", dealId };

    const notification = {
      title: "❌ Deal Cancelled",
      body: `Deal #${dealId} has been cancelled.`,
    };

    await sendFcmToUser(sellerId, notification, data);
    await saveNotification(sellerId, notification, data);
    await sendFcmToUser(buyerId, notification, data);
    await saveNotification(buyerId, notification, data);
    await sendFcmToAdmins(notification, data);
    await saveNotificationToAdmins(notification, data);
  } catch (err: any) {
    console.error("notifyDealCancelled error:", err.message);
  }
};

/**
 * /advertisement (POST) — new advertisement created.
 * Notify: all admins.
 */
export const notifyAdminsNewAdvertisement = async (
  advertisementId: string,
  advertiserName: string
) => {
  try {
    const data: Record<string, string> = {
      type: "NEW_ADVERTISEMENT",
      advertisementId,
    };

    const notification = {
      title: "📢 New Advertisement Submitted",
      body: `A new advertisement has been submitted by ${advertiserName} (ID: ${advertisementId}).`,
    };

    await sendFcmToAdmins(notification, data);
    await saveNotificationToAdmins(notification, data);
  } catch (err: any) {
    console.error("notifyAdminsNewAdvertisement error:", err.message);
  }
};

/**
 * /advertisement/:advertisementId/status — ad status updated (Approved/Rejected/Disabled).
 * Notify: ad owner.
 */
export const notifyAdOwnerStatusUpdate = async (
  advertisementId: string,
  status: "APPROVED" | "REJECTED" | "DISABLED",
  rejectionReason?: string
) => {
  try {
    const ad = await Advertisement.findById(advertisementId);
    if (!ad) return;

    const data: Record<string, string> = {
      type: "ADVERTISEMENT_STATUS_UPDATE",
      advertisementId,
      status,
    };

    let title = "";
    let body = "";

    switch (status) {
      case "APPROVED":
        title = "✅ Advertisement Approved";
        body = `Your advertisement "${ad.title}" has been approved and is now live!`;
        break;
      case "REJECTED":
        title = "❌ Advertisement Rejected";
        body = `Your advertisement "${ad.title}" was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ""}`;
        break;
      case "DISABLED":
        title = "⏸️ Advertisement Disabled";
        body = `Your advertisement "${ad.title}" has been disabled.`;
        break;
    }

    await sendFcmToUser(ad.advertiserId.toString(), { title, body }, data);
    await saveNotification(ad.advertiserId.toString(), { title, body }, data);
  } catch (err: any) {
    console.error("notifyAdOwnerStatusUpdate error:", err.message);
  }
};

/**
 * /kyc/:userId (PATCH) — KYC reviewed by admin.
 * Notify: the user.
 */
export const notifyUserKycStatus = async (
  userId: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) => {
  try {
    const data: Record<string, string> = {
      type: "KYC_STATUS_UPDATE",
      status,
    };

    let title = "";
    let body = "";

    if (status === "approved") {
      title = "✅ KYC Approved";
      body = "Your KYC has been successfully verified. You can now use all features of the app.";
    } else {
      title = "❌ KYC Rejected";
      body = `Your KYC was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : "Please check your documents and try again."}`;
    }

    await sendFcmToUser(userId, { title, body }, data);
    await saveNotification(userId, { title, body }, data);
  } catch (err: any) {
    console.error("notifyUserKycStatus error:", err.message);
  }
};

/**
 * System Logs — notifications for critical/error level system events.
 * Notify: all admins.
 */
export const notifyAdminsSystemLog = async (log: ISystemLog) => {
  try {
    // Only notify for high severity events to avoid spam
    if (!["CRITICAL", "ERROR", "WARNING"].includes(log.severity)) {
      return;
    }

    const data: Record<string, string> = {
      type: "SYSTEM_LOG",
      eventType: log.eventType,
      severity: log.severity,
      logId: log._id?.toString() || "",
    };

    const notification = {
      title: `⚠️ System ${log.severity}: ${log.eventType}`,
      body: log.message,
    };

    await sendFcmToAdmins(notification, data);
    await saveNotificationToAdmins(notification, data);
  } catch (err: any) {
    console.error("notifyAdminsSystemLog error:", err.message);
  }
};