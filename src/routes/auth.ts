import express, {Request, Response} from "express";
import {RequestWithBody, RequestWithQuery} from "../types";
import {UserCreateModel} from "../models/users/UserCreateModel";
import {usersService} from "../domain/users-service";
import {EmailConfirmModel} from "../models/email/EmailConfirmModel";
import {EmailConfirmedStatusModel} from "../models/email/EmailConfirmedStatusModel";
import {htmlManager} from "../managers/html-manager";
import {jwtService} from "../application/jwt-service";
import {AuthResultModel} from "../models/auth/AuthResultModel";
import {AuthResetPasswordModel} from "../models/auth/AuthResetPasswordModel";
import {AuthResetPasswordConfirmModel} from "../models/auth/AuthResetPasswordConfirmModel";
import {AuthResetPasswordTokenModel} from "../models/auth/AuthResetPasswordTokenModel";
import {AuthResetPasswordResponseModel} from "../models/auth/AuthResetPasswordResponseModel";
import {UserDBModel} from "../models/users/UserDBModel";
import {usersRepository} from "../repositories/users/users-repository";

export const getAuthRouter = () => {
    const router = express.Router();

    router.post(
        "/registration",
        async (req: RequestWithBody<UserCreateModel>, res: Response) => {
            const userIpAddress: string =
                String(req.headers["x-forwarded-for"] || "")
                    .split(",")[0]
                    ?.trim() ||
                req.socket.remoteAddress ||
                "0.0.0.0";
            const user: string | false = await usersService.createUser(
                req.body.email,
                req.body.password,
                req.body.userName,
                userIpAddress
            );
            if (user) {
                res.status(201).send(user);
            } else {
                res
                    .status(400)
                    .send(
                        "Something went wrong, please try again a few minutes later"
                    );
            }
        }
    );

    router.post(
        "/login",
        async (req: RequestWithBody<UserCreateModel>, res: Response) => {
            try {
                const tooManyLoginAttempts =
                    await usersService.verifyRecentLoginAttempts(req.body.email);
                // const tooManyLoginAttempts = false
                if (tooManyLoginAttempts) {
                    res.status(429).json({
                        error: "Too many unsuccessful login attempts, try again later",
                    });
                    return;
                }

                const result: AuthResultModel = await usersService.checkCredentials(
                    req.body.email,
                    req.body.password
                );
                if (!result.success) {
                    const loginAttemptDate = new Date();
                    await usersRepository.addRecentLoginAttemptByEmail(
                        req.body.email,
                        loginAttemptDate
                    );
                    res.status(result.statusCode).json({error: result.error});
                    return;
                } else {
                    await usersRepository.clearRecentLoginsByEmail(req.body.email);

                    const tokens = await
                        usersService.createAuthTokens(req.body.email);
                    if (typeof tokens !== "boolean") {
                        res.cookie("refreshToken", tokens.refreshToken, {
                            httpOnly: true,
                            secure: true,
                            sameSite: "strict",
                            maxAge: 30 * 24 * 60 * 60 * 1000,
                        });
                        res.status(200).json({
                            accessToken: tokens.accessToken,
                            deviceId: tokens.deviceId,
                            message: "Login successful",
                        });
                        return;
                    }
                    res.status(400).json("Failed to login");
                }
            } catch (error) {
                console.error("Login error: ", error);
                res.status(400).json("Failed to login");
            }
        }
    );

    router.get(
        "/confirm-email",
        async (req: RequestWithQuery<EmailConfirmModel>, res: Response) => {
            try {
                const result: boolean = await usersService.confirmEmail(
                    req.query.email,
                    req.query.code
                );
                if (result) {
                    res.redirect("email-confirmed?status=success");
                } else {
                    res.redirect(
                        "/email-confirmed?status=error&message=invalid_credentials"
                    );
                }
            } catch (error) {
                console.error("Email confirmation failed: ", error);
                res.redirect("/email-confirmed?status=error&message=server_error");
            }
        }
    );

    router.get(
        "/email-confirmed",
        async (req: RequestWithQuery<EmailConfirmedStatusModel>, res: Response) => {
            const replacements = {
                subject:
                    req.query.status === "success" ? "Login" : "Return to Home Screen",
                message:
                    req.query.status === "success"
                        ? "Your email has been verified."
                        : "Please try again.",
                link: req.query.status === "success" ? "/auth/login" : "/",
            };
            try {
                const html = await htmlManager.generateHTML(
                    "./src/templates/email/emailConfirmed.html",
                    replacements
                );
                res.send(html);
            } catch (error) {
                res.status(500).send("Error loading confirmation page");
            }
        }
    );

    router.post(
        "/reset-password",
        async (req: RequestWithBody<AuthResetPasswordModel>, res: Response) => {
            const result: boolean = await usersService.resetPassword(
                req.body.email,
                req.body.id
            );
            if (result) {
                res.sendStatus(201);
            } else {
                res
                    .status(400)
                    .send("Something went wrong," + " please try again later");
            }
        }
    );

    router.get(
        "reset-password/initiate",
        async (req: RequestWithQuery<{ resetToken: string }>, res: Response) => {
            const {resetToken} = req.query;
            if (!resetToken) {
                res.status(400).json("The reset link is missing or invalid.");
                return;
            }
            const tokenData: AuthResetPasswordTokenModel | null | undefined =
                await jwtService.verifyPasswordResetToken(resetToken);
            if (!tokenData) {
                res
                    .status(400)
                    .json(
                        "This reset link has expired or is invalid. Please request a new one."
                    );
                return;
            }
            res.json({success: true, token: resetToken});
        }
    );

    router.post(
        "/reset-password/confirm",
        async (
            req: RequestWithBody<AuthResetPasswordConfirmModel>,
            res: Response
        ) => {
            if (!req.body.token) {
                res.status(400).json("The reset link is missing or invalid.");
                return;
            }
            const tokenData: AuthResetPasswordTokenModel | null | undefined =
                await jwtService.verifyPasswordResetToken(req.body.token);
            if (!tokenData) {
                res
                    .status(400)
                    .json(
                        "This reset link has expired or is invalid. Please request a new one."
                    );
                return;
            }
            const result: AuthResetPasswordResponseModel =
                await usersService.resetPasswordWithToken(
                    req.body.token,
                    req.body.newPassword
                );
            if (result.success) {
                res.status(200).json("Password successfully changed");
            } else {
                res
                    .status(400)
                    .json("An error occurred: " + result.error || "Unknown error");
            }
        }
    );

    //Call if the client receives 401 error while executing an authorized call

    router.post("/refresh", async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        const deviceIdRaw = req.headers["x-device-id"];
        const deviceId = Array.isArray(deviceIdRaw) ? deviceIdRaw[0] : deviceIdRaw;

        if (!refreshToken) {
            res.status(401).json({error: "No refresh token"});
            return;
        }
        if (!deviceId) {
            res.status(401).json({error: "Device ID required"});
            return;
        }

        try {
            const userId = await jwtService.getUserIdByToken(refreshToken);
            const user: UserDBModel | null = await usersService.findUserById(userId);

            if (!user) {
                res.status(401).json({error: "User not found"});
                return;
            }

            const tokenVersion = jwtService.verifyRefreshTokenVersion(refreshToken);
            if (!tokenVersion) {
                res.status(401).json({error: "Invalid refresh token"});
                return;
            }

            const correctTokenVersion = user?.accountData.refreshTokensMeta?.find(
                (meta) =>
                    meta.issuedAt.getTime() === tokenVersion.getTime() &&
                    meta.deviceId === deviceId
            );
            if (!correctTokenVersion) {
                res
                    .status(401)
                    .json({error: "Invalid refresh token for this device"});
                return;
            }

            const newTokens = await usersService.createAuthTokens(
                user.accountData.email,
                deviceId
            );

            if (newTokens && typeof newTokens !== "boolean") {
                res.cookie("refreshToken", newTokens.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });

                res.json({
                    accessToken: newTokens.accessToken,
                    deviceId: newTokens.deviceId,
                });
            } else {
                res.status(401).json({error: "Something went wrong"});
            }
        } catch (error) {
            console.error("Refresh token error:", error);
            res.status(401).json({error: "Invalid refresh token"});
        }
    });

    return router;
};
