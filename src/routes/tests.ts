import express, {Request, Response} from "express";
import {DBType} from "../db/db";

export const getTestsRoutes = (db: DBType) => {
    const router = express.Router()

    router.delete('/data', (req: Request, res: Response) => {
        db.articles = []
        res.sendStatus(204)
    })

    return router
}