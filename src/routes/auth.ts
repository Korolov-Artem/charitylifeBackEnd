import express, {Response} from "express";
import {RequestWithBody} from "../types";
import {UserCreateModel} from "../models/users/UserCreateModel";
import {usersService} from "../domain/users-service";
import {jwtService} from "../application/jwt-service";
import {UserDBModel} from "../models/users/UserDBModel";

export const getAuthRouter = () => {
    const router = express.Router();

    router.post('/', async (req: RequestWithBody<UserCreateModel>, res: Response) => {
        const user: UserDBModel | false = await usersService.checkCredentials(
            req.body.email, req.body.password);
        if (user) {
            const token = await jwtService.createJWT(user);
            res.status(201).json(token)
        } else {
            res.sendStatus(401)
        }
    })
    return router
}