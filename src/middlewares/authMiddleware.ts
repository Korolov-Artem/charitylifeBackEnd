import {NextFunction, Response} from "express";
import {jwtService} from "../application/jwt-service";
import {usersService} from "../domain/users-service";
import {AuthenticatedRequest} from "../models/auth/AuthenticatedRequest";

export const authMiddleware = async (req: AuthenticatedRequest,
                                     res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        res.sendStatus(401);
        return
    }

    const token = req.headers.authorization.split(' ')[1];
    const userId = await jwtService.getUserIdByToken(token);
    if (!userId) {
        res.sendStatus(401)
        return
    }

    const user = await usersService.findUserById(userId.toString());
    if (!user) {
        res.sendStatus(401)
        return
    }

    req.user = user
    next()
}