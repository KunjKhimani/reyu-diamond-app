import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuction extends Document {
  inventoryId: mongoose.Types.ObjectId;

  basePrice: number;
  currentBid: number;

  isHighestBid: boolean;
  highestBidderId?: mongoose.Types.ObjectId;

  bidIds: mongoose.Types.ObjectId[];
  highestBidId?: mongoose.Types.ObjectId;

  startDate: Date;
  endDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema: Schema<IAuction> = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0
    },

    currentBid: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    highestBidderId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    bidIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bid"
      }
    ],

    highestBidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid"
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Auction: Model<IAuction> =
  mongoose.models.Auction ||
  mongoose.model<IAuction>("Auction", AuctionSchema);
