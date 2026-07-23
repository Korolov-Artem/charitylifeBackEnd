import express, {Request, Response} from "express";
import { uploadMiddleware } from "../middlewares/uploadMiddlewate";
import { mediaCollection } from "../db/db";

export const getUploadRoutes = () => {
  const router = express.Router()

  router.get("/", async (req: Request, res: Response) => {
          try {
              // Fetch all media assets, sorted by newest first
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

            const relativeUrl = `/uploads/${req.file.filename}`;

            const newAsset = {
                filename: req.file.filename,
                url: relativeUrl,
                uploadedAt: new Date(),
            };

            try {
                // Save the record to MongoDB so the GET route can find it later
                await mediaCollection.insertOne(newAsset);

                res.status(200).json({
                    url: relativeUrl,
                    filename: req.file.filename
                });
            } catch (error) {
                console.error("Database error saving media:", error);
                res.status(500).json({ message: "File saved, but failed to record in database" });
            }
        });

    return router
}
