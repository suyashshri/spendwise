import { Schema, model, type Document, type Types } from "mongoose";
import { DEFAULT_CURRENCY } from "@spendwise/shared";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  passwordHash?: string;
  authProvider: "email" | "google";
  googleId?: string;
  currency: string;
  categories: string[];
  monthlyBudget?: number;
  refreshTokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ["email", "google"], required: true },
    googleId: { type: String },
    currency: { type: String, default: DEFAULT_CURRENCY },
    categories: { type: [String], default: [] },
    monthlyBudget: { type: Number },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = model<UserDocument>("User", userSchema);
