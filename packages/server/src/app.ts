import express, { type Express } from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import parseRoutes from "./routes/parse";
import transactionRoutes from "./routes/transactions";
import budgetRoutes from "./routes/budgets";
import analyticsRoutes from "./routes/analytics";
import categoryRoutes from "./routes/categories";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/parse", parseRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/budgets", budgetRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/categories", categoryRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
