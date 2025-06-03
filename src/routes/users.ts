import express from "express";

export const getUsersRoutes = () => {
    const router = express.Router()

    // router.post('/', async (req: RequestWithBody<UserCreateModel>,
    //                         res: Response<string>) => {
    //     const newUser = await usersService.createUser(req.body.email,
    //         req.body.userName, req.body.password)
    //     res.status(201).json(newUser)
    // })

    return router
}