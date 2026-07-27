import fs from "node:fs";
import path from "node:path";

/**
 * Where uploaded and archived media lives on disk.
 *
 * Defaults to <cwd>/uploads, which sits inside the app directory — fine locally,
 * but on shared hosting a redeploy that replaces that directory takes the whole
 * archive with it. Set UPLOAD_DIR to an absolute path outside the app root there.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads");

/** Public path the same files are served under. */
export const UPLOAD_ROUTE = "/uploads";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
