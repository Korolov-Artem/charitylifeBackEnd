import express from "express";
import bodyParser from "body-parser";
import {getArticlesRoutes} from "./routes/articles";
import {getTestsRoutes} from "./routes/tests";
import {memoryDB} from "./db/db";
import {getUsersRoutes} from "./routes/users";
import {getAuthRouter} from "./routes/auth";
import {getReactionRouter} from "./routes/reactions";
import path from "node:path";
import {getUploadRoutes} from "./routes/upload"; // Import if not already at top

const cookieParser = require("cookie-parser");

export const app = express();

const cors = require("cors");
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

const uploadRouter = getUploadRoutes();
app.use("/upload", uploadRouter);

export const parserMiddleware = bodyParser.json();

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(parserMiddleware);

app.use(cookieParser());

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
