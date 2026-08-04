import { Schema, model, type Document, type Types } from "mongoose";
import { DEFAULT_CURRENCY, type TransactionInputType } from "@spendwise/shared";

export interface TransactionDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  amountInBaseCurrency: number;
  exchangeRate: number;
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
    currency: { type: String, required: true, default: DEFAULT_CURRENCY },
    // Default (not a static value, a function of `this.amount`) rather than leaving this bare-
    // required: Mongoose applies schema defaults whenever a path is undefined at document
    // hydration time, including for pre-multi-currency documents loaded from the DB that predate
    // this field — so an old document "heals" itself (amountInBaseCurrency = amount, i.e. no
    // conversion) the moment it's next loaded, rather than failing validation on its next .save().
    // Aggregations additionally $ifNull against `amount` as a second safety net — see
    // services/budgetChecker.ts.
    amountInBaseCurrency: {
      type: Number,
      required: true,
      default: function (this: TransactionDocument) {
        return this.amount;
      },
    },
    exchangeRate: { type: Number, required: true, default: 1 },
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
