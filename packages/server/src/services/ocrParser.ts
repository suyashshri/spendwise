import { createWorker } from "tesseract.js";

/**
 * Extracts raw text from a UPI payment screenshot. Uses Tesseract.js (bundled, no API key or
 * cloud billing required) rather than Google Cloud Vision — see specifications/05-ai-categorization.md
 * "OCR path". A worker is created fresh per call rather than pooled; this is simplest and safest
 * for correctness, at the cost of a ~1-2s language-data load per request. Revisit with a pooled
 * worker if screenshot volume ever makes that latency matter.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
