import express, {Response} from "express";
import {RequestWithBody} from "../types";
import {UserCreateModel} from "../models/users/UserCreateModel";
import {usersService} from "../domain/users-service"

export const getUsersRoutes = () => {
    const router = express.Router()

    router.post('/', async (req: RequestWithBody<UserCreateModel>,
                            res: Response<string>) => {
        const newUser = await usersService.createUser(req.body.email, req.body.password)
        res.status(201).json(newUser)
    })

    return router
}