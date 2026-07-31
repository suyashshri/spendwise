import mongoose from "mongoose";
import { config } from "./config";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongodbUri);
  // eslint-disable-next-line no-console
  console.log("[db] connected to MongoDB");
}
