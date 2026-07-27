import multer from "multer";
import path from "node:path";
import { UPLOAD_DIR } from "../configs/storage-config";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
        const extension = path.extname(file.originalname)
        cb(null, file.fieldname + "-" + uniqueSuffix + extension)
    }
})

export const uploadMiddleware = multer({storage: storage});
