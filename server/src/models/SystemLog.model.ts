import mongoose, { Schema, Document, Model } from "mongoose";

export type SystemSeverity =
    | "INFO"
    | "WARNING"
    | "ERROR"
    | "CRITICAL";

export type SystemEventType =
    | "PAYMENT_INTENT_INITIATED"
    | "PAYMENT_HELD"
    | "PAYMENT_RELEASED"
    | "PAYMENT_FAILED"
    | "WEBHOOK_ERROR"
    | "DATABASE_ERROR" 
    | "AUTH_FAILURE"
    | "UNAUTHORIZED_ACCESS_ATTEMPT"
    | "SYSTEM_EXCEPTION"
    | "JOB_COMPLETED"
    | "JOB_FAILED"
    | "JOB_MOVED_TO_DLQ";

export interface ISystemLog extends Document {
    eventType: SystemEventType;
    targetId: mongoose.Types.ObjectId;
    severity: SystemSeverity;
    message: string;
    meta?: Record<string, any>;
    createdAt: Date;
}

const SystemLogSchema = new Schema<ISystemLog>(
    {
        eventType: {
            type: String,
            enum: [
                "PAYMENT_INTENT_INITIATED",
                "PAYMENT_HELD",
                "PAYMENT_RELEASED",
                "PAYMENT_FAILED",
                "ESCROW_CREATED",
                "WEBHOOK_ERROR",
                "DATABASE_ERROR",
                "AUTH_FAILURE",
                "UNAUTHORIZED_ACCESS_ATTEMPT",
                "SYSTEM_EXCEPTION",
                "JOB_COMPLETED",
                "JOB_FAILED",
                "JOB_MOVED_TO_DLQ"
            ],
            required: true,
            index: true
        },
        targetId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        severity: {
            type: String,
            enum: ["INFO", "WARNING", "ERROR", "CRITICAL"],
            required: true,
            index: true
        },
        message: {
            type: String,
            required: true
        },
        meta: {
            type: Schema.Types.Mixed
        }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const SystemLog: Model<ISystemLog> =
    mongoose.model<ISystemLog>("SystemLog", SystemLogSchema);
