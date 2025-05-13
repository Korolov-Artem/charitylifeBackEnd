import {Request} from "express";
import {UserDBModel} from "../users/UserDBModel";

export type AuthenticatedRequest = Request & {
    user?: UserDBModel | null
}