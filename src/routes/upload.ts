import express, {Request, Response} from "express";

import {uploadMiddleware} from "../middlewares/uploadMiddlewate";

export const getUploadRoutes = () => {
    const router = express.Router()

    router.post("/", uploadMiddleware.single("file"),
        (req: Request, res: Response) => {
            if (!req.file) {
                res.status(400).json({message: "No file uploaded"})
                return
            }

            const fileUrl = `/uploads/${req.file.filename}`
            res.status(200).json({
                url: fileUrl,
                filename: req.file.filename
            })
        })

    return router
}