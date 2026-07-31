import { DEFAULT_CATEGORIES } from "@spendwise/shared";
import { connectDB } from "../config/db";
import { Category } from "../models/Category";
import mongoose from "mongoose";

async function seed(): Promise<void> {
  await connectDB();

  for (const category of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { name: category.name },
      { $set: { ...category, isDefault: true } },
      { upsert: true }
    );
    // eslint-disable-next-line no-console
    console.log(`[seed] upserted category: ${category.name}`);
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] done — ${DEFAULT_CATEGORIES.length} default categories seeded`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed] failed:", err);
  process.exit(1);
});
