import * as cheerio from "cheerio";
import axios from "axios";
import fs from "node:fs";
import path from "node:path";
import { mediaCollection } from "../db/db";
import { UPLOAD_DIR } from "../configs/storage-config";

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

// Where our own media lives. Set PUBLIC_URL in production, or every image the
// editor just uploaded looks external and gets archived a second time.
const SELF_ORIGIN = (process.env.PUBLIC_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/**
 * Absolute form of a src, or null if there is nothing to fetch. Relative paths
 * are already ours. Protocol-relative URLs come from hosts that serve over both
 * schemes; https is the safe assumption.
 */
const toAbsolute = (src: string): string | null => {
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return null;
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
      const absolute = src ? toAbsolute(src) : null;

      // Anything already on our own host is left alone.
      if (!absolute || absolute.startsWith(SELF_ORIGIN)) continue;

      try {
        console.log(`[Archiver] Fetching external media: ${absolute}`);

        const response = await axios({
          url: absolute,
          method: "GET",
          responseType: "arraybuffer",
          timeout: 10000, // an unresponsive host must not stall the save
        });

        const contentType = response.headers["content-type"] || "";
        const originalExt = path.extname(new URL(absolute).pathname);
        const ext = getExtensionFromContentType(String(contentType), originalExt);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = `archive-${uniqueSuffix}${ext}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        fs.writeFileSync(filepath, response.data);

        // Rewrite before recording the asset: the tag pointing at our copy is
        // the part that matters, and it must not hinge on the gallery insert.
        $(el).attr(target.attr, `/uploads/${filename}`);

        // A surviving srcset would win over the src we just rewrote and send
        // the reader straight back to the origin host.
        $(el).removeAttr("srcset").removeAttr("sizes");

        try {
          await mediaCollection.insertOne({
            filename: filename,
            url: `/uploads/${filename}`,
            uploadedAt: new Date(),
          });
        } catch (error) {
          // Only costs the file its row in the media drawer.
          console.error(
            `[Archiver] Archived ${filename} but failed to record it.`,
            error,
          );
        }
      } catch (error) {
        // Swallowed on purpose: a failed archive still leaves a working
        // external link, and that beats refusing to save the article.
        console.error(
          `[Archiver] Failed to archive media ${absolute}. Leaving original link intact.`,
        );
      }
    }
  }

  // <picture> serves these ahead of the <img> we archived, so any that are
  // still external have to go for the local copy to be the one used.
  $("picture source[srcset]").each((_i, el) => {
    const srcset = $(el).attr("srcset");
    const first = srcset?.trim().split(/[\s,]+/)[0] ?? "";
    const absolute = toAbsolute(first);
    if (absolute && !absolute.startsWith(SELF_ORIGIN)) $(el).remove();
  });

  return $("body").html() || htmlContent;
};
