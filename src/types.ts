import {Request} from "express";
import {UserDBModel} from "./models/users/UserDBModel";

export type RequestWithBody<T> = Request<{}, {}, T>
export type RequestWithQuery<T> = Request<{}, {}, {}, T>
export type RequestWithParams<T> = Request<T>
export type RequestWithParamsAndBody<T, B> = Request<T, {}, B>
export type AuthRequestWithBody<T> = RequestWithBody<T> & { user: UserDBModel }