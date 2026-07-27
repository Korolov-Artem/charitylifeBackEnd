import fs from "node:fs";
import path from "node:path";

/**
 * Legacy local media directory.
 *
 * Nothing writes here any more — uploads and archived media go to Cloudinary.
 * This only still serves `/uploads/...` URLs baked into articles published
 * before that switch, and only on a host where those files actually exist.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

/** Public path the same files are served under. */
export const UPLOAD_ROUTE = "/uploads";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
