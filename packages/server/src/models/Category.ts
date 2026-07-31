import { Schema, model, type Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  isDefault: boolean;
}

const categorySchema = new Schema<CategoryDocument>({
  name: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  keywords: { type: [String], default: [] },
  isDefault: { type: Boolean, default: false },
});

export const Category = model<CategoryDocument>("Category", categorySchema);
