import express from "express";
import bodyParser from "body-parser";
import {getArticlesRoutes} from "./routes/articles";
import {getTestsRoutes} from "./routes/tests";
import {db} from "./db/db";

export const app = express();

export const parserMiddleware = bodyParser.json();
app.use(parserMiddleware)

const articlesRouter = getArticlesRoutes()
app.use("/articles", articlesRouter)

const testsRouter = getTestsRoutes(db)
app.use("/__test__", testsRouter)