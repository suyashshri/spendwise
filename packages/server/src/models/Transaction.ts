import { Schema, model, type Document, type Types } from "mongoose";
import type { TransactionInputType } from "@spendwise/shared";

export interface TransactionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  merchant: string;
  category: string;
  rawInput?: string;
  inputType: TransactionInputType;
  upiRefId?: string;
  date: Date;
  note?: string;
  confidence: number;
  isRecurring: boolean;
  needsReview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    merchant: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    rawInput: { type: String },
    inputType: {
      type: String,
      enum: ["share_text", "screenshot", "manual"],
      required: true,
    },
    upiRefId: { type: String },
    date: { type: Date, required: true },
    note: { type: String },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    isRecurring: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ upiRefId: 1 }, { unique: true, sparse: true });

export const Transaction = model<TransactionDocument>("Transaction", transactionSchema);
