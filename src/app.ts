import express from "express";
import bodyParser from "body-parser";
import { getArticlesRoutes } from "./routes/articles";
import { getTestsRoutes } from "./routes/tests";
import { memoryDB } from "./db/db";
import { getUsersRoutes } from "./routes/users";
import { getAuthRouter } from "./routes/auth";
import { getReactionRouter } from "./routes/reactions";
import path from "node:path";
import { getUploadRoutes } from "./routes/upload";
import { getPollsRoutes } from "./routes/polls";

const cookieParser = require("cookie-parser");

export const app = express();

const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

export const parserMiddleware = bodyParser.json({ limit: "50mb" });
app.use(parserMiddleware);

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());

const uploadsPath = path.resolve(process.cwd(), "uploads");

app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".bmp": "image/bmp",
      };

      if (contentTypes[ext]) {
        res.setHeader("Content-Type", contentTypes[ext]);
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  }),
);

const uploadRouter = getUploadRoutes();
app.use("/upload", uploadRouter);

const articlesRouter = getArticlesRoutes();
app.use("/articles", articlesRouter);

const usersRouter = getUsersRoutes();
app.use("/users", usersRouter);

const authRouter = getAuthRouter();
app.use("/auth", authRouter);

const reactionsRouter = getReactionRouter();
app.use("/reactions", reactionsRouter);

const testsRouter = getTestsRoutes(memoryDB);
app.use("/__test__", testsRouter);

const pollsRouter = getPollsRoutes();
app.use("/polls", pollsRouter);
