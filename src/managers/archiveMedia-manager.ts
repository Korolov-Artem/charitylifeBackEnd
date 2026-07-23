import * as cheerio from "cheerio";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { mediaCollection } from "../db/db";

// Ensure our uploads directory exists
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Helper to determine file extension based on Axios response headers
const getExtensionFromContentType = (
  contentType: string,
  originalExt: string,
): string => {
  if (contentType.includes("image/jpeg")) return ".jpg";
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/gif")) return ".gif";
  if (contentType.includes("image/webp")) return ".webp";
  if (contentType.includes("video/mp4")) return ".mp4";
  if (contentType.includes("video/webm")) return ".webm";
  if (contentType.includes("audio/mpeg")) return ".mp3";
  if (contentType.includes("audio/wav")) return ".wav";

  // If the server doesn't tell us, fallback to whatever the URL extension was, or .jpg
  return originalExt || ".jpg";
};

/**
 * Scans HTML content, downloads external media (images, video, audio),
 * and replaces their URLs with permanent local paths.
 */
export const archiveExternalMedia = async (
  htmlContent: string,
): Promise<string> => {
  if (!htmlContent) return htmlContent;

  const $ = cheerio.load(htmlContent);
  // 1. Define all the tags and attributes we want to hunt for
  const mediaTargets = [
    { selector: "img", attr: "src" },
    { selector: "video source", attr: "src" }, // Often nested: <video><source src="..."></video>
    { selector: "video", attr: "src" }, // Sometimes direct: <video src="..."></video>
    { selector: "audio", attr: "src" },
    { selector: "audio source", attr: "src" },
  ];

  // 2. We use a standard for loop because we must 'await' the downloads sequentially
  for (const target of mediaTargets) {
    const elements = $(target.selector).toArray();

    for (const el of elements) {
      const src = $(el).attr(target.attr);

      // Check if it's an external link and NOT already safely hosted on our server
      if (src && src.startsWith("http") && !src.includes("localhost:3000")) {
        try {
          console.log(`[Archiver] Fetching external media: ${src}`);

          // 3. Download the binary data
          const response = await axios({
            url: src,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 10000, // 10 second timeout so huge broken videos don't freeze the server
          });

          // 4. Safely determine the file type
          const contentType = response.headers["content-type"] || "";
          const originalExt = path.extname(new URL(src).pathname);
          const ext = getExtensionFromContentType(String(contentType), originalExt);
          // 5. Generate unique filename and save
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const filename = `archive-${uniqueSuffix}${ext}`;
          const filepath = path.join(uploadDir, filename);

          fs.writeFileSync(filepath, response.data);

          await mediaCollection.insertOne({
            filename: filename,
            url: `/uploads/${filename}`,
            uploadedAt: new Date(),
          });

          // 6. Rewrite the HTML tag to use our permanent local link!
          $(el).attr(target.attr, `/uploads/${filename}`);
        } catch (error) {
          console.error(
            `[Archiver] Failed to archive media ${src}. Leaving original link intact.`,
          );
          // Silent catch: The article will still save, and the user will just rely on the original external link.
        }
      }
    }
  }

  // 7. Return the completely unified HTML string
  return $("body").html() || htmlContent;
};
