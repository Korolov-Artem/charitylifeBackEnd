import {NextFunction, Response} from "express";
import {jwtService} from "../application/jwt-service";
import {usersService} from "../domain/users-service";
import {AuthenticatedRequest} from "../models/auth/AuthenticatedRequest";
import {UserDBModel} from "../models/users/UserDBModel";

export const authMiddleware = async (req: AuthenticatedRequest,
                                     res: Response, next: NextFunction) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        res.sendStatus(401);
        return;
    }
    const token: string = req.headers.authorization.split(' ')[1];

    const userId = await jwtService.getUserIdByToken(token);
    if (!userId) {
        res.sendStatus(401)
        return
    }

    const user: UserDBModel | null = await usersService.findUserById(userId.toString());
    if (!user) {
        res.sendStatus(401)
        return
    }

    req.user = user
    next()
}