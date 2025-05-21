import express, {Response} from "express";
import {RequestWithBody} from "../types";
import {EmailSendModel} from "../models/email/EmailSendModel";
import {emailService} from "../domain/email-service";

export const getEmailRouter = () => {
    const router = express.Router()

    router.post("/send", async (req: RequestWithBody<EmailSendModel>,
                                res: Response) => {
        const result = await emailService.sendNewArticleNotificationEmail(
            req.body.email, req.body.userName, req.body.subject, req.body.message)
        if (!result) {
            res.sendStatus(502)
        } else {
            res.sendStatus(200)
        }
    })

    return router
}