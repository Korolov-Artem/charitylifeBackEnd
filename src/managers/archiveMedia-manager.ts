import * as cheerio from "cheerio";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { mediaCollection } from "../db/db";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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

  return originalExt || ".jpg";
};

/**
 * Pulls externally-hosted media into /uploads and rewrites the tags to point at
 * the local copy, so an article survives the source going away.
 */
export const archiveExternalMedia = async (
  htmlContent: string,
): Promise<string> => {
  if (!htmlContent) return htmlContent;

  const $ = cheerio.load(htmlContent);
  // Both the bare tag and the nested <source> — editors emit either form.
  const mediaTargets = [
    { selector: "img", attr: "src" },
    { selector: "video source", attr: "src" },
    { selector: "video", attr: "src" },
    { selector: "audio", attr: "src" },
    { selector: "audio source", attr: "src" },
  ];

  // Sequential rather than Promise.all: a paste can carry a dozen videos and we
  // don't want to open that many sockets at once.
  for (const target of mediaTargets) {
    const elements = $(target.selector).toArray();

    for (const el of elements) {
      const src = $(el).attr(target.attr);

      // Anything already on our own host is left alone.
      if (src && src.startsWith("http") && !src.includes("localhost:3000")) {
        try {
          console.log(`[Archiver] Fetching external media: ${src}`);

          const response = await axios({
            url: src,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 10000, // an unresponsive host must not stall the save
          });

          const contentType = response.headers["content-type"] || "";
          const originalExt = path.extname(new URL(src).pathname);
          const ext = getExtensionFromContentType(String(contentType), originalExt);
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

          $(el).attr(target.attr, `/uploads/${filename}`);
        } catch (error) {
          // Swallowed on purpose: a failed archive still leaves a working
          // external link, and that beats refusing to save the article.
          console.error(
            `[Archiver] Failed to archive media ${src}. Leaving original link intact.`,
          );
        }
      }
    }
  }

  return $("body").html() || htmlContent;
};
