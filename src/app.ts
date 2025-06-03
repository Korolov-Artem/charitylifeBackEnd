import express from "express";
import bodyParser from "body-parser";
import {getArticlesRoutes} from "./routes/articles";
import {getTestsRoutes} from "./routes/tests";
import {memoryDB} from "./db/db";
import {getUsersRoutes} from "./routes/users";
import {getAuthRouter} from "./routes/auth";
import {getReactionRouter} from "./routes/reactions";

export const app = express();

export const parserMiddleware = bodyParser.json();
app.use(parserMiddleware)

const articlesRouter = getArticlesRoutes()
app.use("/articles", articlesRouter)

const usersRouter = getUsersRoutes()
app.use("/users", usersRouter)

const authRouter = getAuthRouter();
app.use("/auth", authRouter)

const reactionsRouter = getReactionRouter()
app.use("/reactions", reactionsRouter)

const testsRouter = getTestsRoutes(memoryDB)
app.use("/__test__", testsRouter)

