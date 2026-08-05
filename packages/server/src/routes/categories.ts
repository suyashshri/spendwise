import { Router } from "express";
import { Types } from "mongoose";
import { DEFAULT_CATEGORY_NAMES } from "@spendwise/shared";
import { Category } from "../models/Category";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../utils/AppError";
import { createCategorySchema } from "../utils/schemas";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = new Types.ObjectId(req.user!.id);
    const categories = await Category.find({ $or: [{ isDefault: true }, { userId }] }).sort({
      isDefault: -1,
      name: 1,
    });
    res.json({ categories: categories.map((c) => c.toJSON()) });
  })
);

router.post(
  "/",
  validateBody(createCategorySchema),
  asyncHandler(async (req, res) => {
    const { name, icon, color } = req.body as { name: string; icon: string; color: string };
    const userId = new Types.ObjectId(req.user!.id);

    if (DEFAULT_CATEGORY_NAMES.some((n) => n.toLowerCase() === name.toLowerCase())) {
      throw AppError.conflict(`"${name}" is already a default category`, "CATEGORY_NAME_TAKEN");
    }

    const existing = await Category.findOne({
      userId,
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      throw AppError.conflict(`You already have a category named "${name}"`, "CATEGORY_NAME_TAKEN");
    }

    const category = await Category.create({ name, icon, color, userId, isDefault: false, keywords: [] });
    res.status(201).json({ category: category.toJSON() });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!category) {
      throw AppError.notFound("Category not found");
    }
    // The userId match above already excludes defaults (they have no userId), but this is the
    // load-bearing guarantee, so state it explicitly rather than relying only on the query shape.
    if (category.isDefault) {
      throw AppError.forbidden("Default categories can't be deleted", "CANNOT_DELETE_DEFAULT");
    }

    await category.deleteOne();
    res.status(204).end();
  })
);

export default router;
