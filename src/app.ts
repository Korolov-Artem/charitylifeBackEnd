import express from "express";
import bodyParser from "body-parser";
import {getArticlesRoutes} from "./routes/articles";
import {getTestsRoutes} from "./routes/tests";
import {memoryDB} from "./db/db";

export const app = express();

export const parserMiddleware = bodyParser.json();
app.use(parserMiddleware)

const articlesRouter = getArticlesRoutes()
app.use("/articles", articlesRouter)

const testsRouter = getTestsRoutes(memoryDB)
app.use("/__test__", testsRouter)

