import multer from "multer";

// Buffers, not disk: Render's filesystem is ephemeral, so uploads go straight
// on to Cloudinary and nothing is ever written locally.
export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});
