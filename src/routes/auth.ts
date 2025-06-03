import express, {Response} from "express";
import {RequestWithBody, RequestWithQuery} from "../types";
import {UserCreateModel} from "../models/users/UserCreateModel";
import {usersService} from "../domain/users-service";
import {EmailConfirmModel} from "../models/email/EmailConfirmModel";
import {EmailConfirmedStatusModel} from "../models/email/EmailConfirmedStatusModel";
import {htmlManager} from "../managers/html-manager";
import {jwtService} from "../application/jwt-service";

export const getAuthRouter = () => {
    const router = express.Router();

    router.post("/registration", async (req: RequestWithBody<UserCreateModel>, res: Response) => {
        const userIpAddress: string =
            String(req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
            req.socket.remoteAddress || '0.0.0.0';
        const user: string | false = await usersService.createUser(req.body.email,
            req.body.password, req.body.userName, userIpAddress)
        if (user) {
            res.status(201).send(user);
        } else {
            res.status(400).send("Something went wrong," +
                " please try again a few minutes later");
        }
    })

    router.post('/login', async (req: RequestWithBody<UserCreateModel>, res: Response) => {
        try {
            const result = await usersService.checkCredentials(
                req.body.email, req.body.password);
            if (!result.success) {
                res.status(result.statusCode).json({error: result.error})
            } else {
                const token = await jwtService.createJWT(result.user);
                res.status(200).json(token)
            }
        } catch (error) {
            console.error("Login error: ", error)
            res.status(400).json("Failed to login")
        }
    })

    router.get("/confirm-email",
        async (req: RequestWithQuery<EmailConfirmModel>, res: Response) => {
            try {
                const result = await usersService.confirmEmail(
                    req.query.email, req.query.code)
                if (result) {
                    res.redirect("email-confirmed?status=success");
                } else {
                    res.redirect('/email-confirmed?status=error&message=invalid_credentials');
                }
            } catch (error) {
                console.error("Email confirmation failed: ", error);
                res.redirect('/email-confirmed?status=error&message=server_error');
            }
        })

    router.get("/email-confirmed",
        async (req: RequestWithQuery<EmailConfirmedStatusModel>, res: Response) => {
            const replacements = {
                subject: req.query.status === "success" ? "Login" : "Return to Home Screen",
                message: req.query.status === 'success' ? 'Your email has been verified.'
                    : 'Please try again.',
                link: req.query.status === 'success' ? '/auth/login' : '/'
            }
            try {
                const html = await htmlManager.generateHTML(
                    "./src/templates/email/emailConfirmed.html", replacements)
                res.send(html)
            } catch (error) {
                res.status(500).send('Error loading confirmation page');
            }
        })

    return router
}