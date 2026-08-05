import { Schema, model, type Document, type Types } from "mongoose";
import type { BudgetPeriod } from "@spendwise/shared";

export interface BudgetDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  category: string;
  limit: number;
  period: BudgetPeriod;
  alertAt: number;
  isActive: boolean;
  /** When a push notification was last sent for this budget crossing its alertAt threshold.
   * Compared against the current period's start (services/budgetChecker.ts periodStart()) so a
   * user gets exactly one alert per period, not one per transaction after the threshold — see
   * specifications/16-push-notifications.md. */
  lastAlertSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<BudgetDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ["monthly", "weekly"], required: true },
    alertAt: { type: Number, min: 0, max: 100, default: 80 },
    isActive: { type: Boolean, default: true },
    lastAlertSentAt: { type: Date },
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

budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

export const Budget = model<BudgetDocument>("Budget", budgetSchema);
