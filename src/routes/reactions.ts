import express, {Response} from "express";
import {authMiddleware} from "../middlewares/authMiddleware";
import {reactionsService} from "../domain/reactions-service";

export const getReactionRouter = () => {
    const router = express.Router()

    router.post('/', authMiddleware, async (req: any,
                                            res: Response) => {
        const newReaction = await reactionsService.sendReaction(req.body.feedback,
            req.body.articleId, req.user.id)
        res.status(201).json(newReaction)
    })
    return router
}