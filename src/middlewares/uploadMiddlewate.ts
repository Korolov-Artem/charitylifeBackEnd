import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const uploadDir = "uploads"
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
        const extension = path.extname(file.originalname)
        cb(null, file.fieldname + "-" + uniqueSuffix + extension)
    }
})

export const uploadMiddleware = multer({storage: storage});