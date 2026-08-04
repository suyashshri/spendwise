import multer from "multer";

// Screenshots are OCR'd in-process and never written to disk (see services/ocrParser.ts),
// so memory storage is fine — capped well under Express's default body size to bound memory use.
export const uploadScreenshot = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
