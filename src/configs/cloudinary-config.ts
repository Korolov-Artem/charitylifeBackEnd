import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    "[Cloudinary] Not configured — uploads will fail. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
  );
}

/** Folder everything lands in, so the console stays navigable. */
const FOLDER = process.env.CLOUDINARY_FOLDER || "charitylife";

export type StoredAsset = {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
};

/**
 * Push a buffer to Cloudinary and hand back the canonical URL.
 *
 * resource_type "auto" matters: the same call carries images, video and audio,
 * and Cloudinary rejects a video sent to the image endpoint.
 */
export const uploadBuffer = (
  buffer: Buffer,
  originalName?: string,
): Promise<StoredAsset> =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      reject(new Error("Cloudinary is not configured"));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, resource_type: "auto" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    stream.end(buffer);
  });

/** True for URLs Cloudinary already serves, so the archiver leaves them alone. */
export const isCloudinaryUrl = (url: string) =>
  /^https?:\/\/res\.cloudinary\.com\//.test(url);
