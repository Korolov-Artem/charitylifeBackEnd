import express, {Request, Response} from "express";
import { uploadMiddleware } from "../middlewares/uploadMiddlewate";
import { mediaCollection } from "../db/db";
import { uploadBuffer, describeCloudinaryConfig } from "../configs/cloudinary-config";

export const getUploadRoutes = () => {
  const router = express.Router()

  router.get("/", async (req: Request, res: Response) => {
          try {
              const media = await mediaCollection.find().sort({ uploadedAt: -1 }).toArray();
              res.status(200).json(media);
          } catch (error) {
              console.error("Error fetching media archive:", error);
              res.status(500).json({ message: "Failed to fetch media archive" });
          }
      });

    router.post("/", uploadMiddleware.single("file"), async (req: Request, res: Response) => {
            if (!req.file) {
                res.status(400).json({ message: "No file uploaded" });
                return;
            }

            let stored;
            try {
                stored = await uploadBuffer(req.file.buffer, req.file.originalname);
            } catch (error) {
                console.error("Cloudinary upload failed:", error);
                console.error("[Cloudinary]", describeCloudinaryConfig());
                res.status(502).json({ message: "Failed to store the file" });
                return;
            }

            // Indexing is for the media drawer only — the file is already safe
            // on Cloudinary, so a database failure must not read as a lost upload.
            try {
                await mediaCollection.insertOne({
                    filename: req.file.originalname,
                    url: stored.url,
                    publicId: stored.publicId,
                    uploadedAt: new Date(),
                });
            } catch (error) {
                console.error("Database error recording media:", error);
            }

            res.status(200).json({
                url: stored.url,
                filename: req.file.originalname,
            });
        });

    return router
}
