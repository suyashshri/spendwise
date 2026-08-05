import { Schema, model, type Document, type Types } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  isDefault: boolean;
  /** Absent for default/system categories; set to the owning user's id for user-created ones. */
  userId?: Types.ObjectId;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    keywords: { type: [String], default: [] },
    isDefault: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
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

// Compound rather than a bare unique-on-name: lets different users each have a category named
// e.g. "Side Hustle" without colliding, while keeping default categories (userId absent on all of
// them) mutually unique among themselves. Route-level validation additionally blocks a user from
// creating a custom category that duplicates a *default* category's name (see routes/categories.ts)
// — the index alone wouldn't catch that, since (userId, name) and (undefined, name) are distinct keys.
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category = model<CategoryDocument>("Category", categorySchema);
