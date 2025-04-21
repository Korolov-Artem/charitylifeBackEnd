import {NextFunction, Response} from "express";
import {validationResult} from "express-validator";
import {RequestWithBody} from "../types";


export const inputValidationMiddleware = (
    req: RequestWithBody<any>, res: Response, next: NextFunction) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).send({
            errors: result.array()
        })
    } else {
        next()
    }
}