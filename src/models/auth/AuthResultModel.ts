import {UserDBModel} from "../users/UserDBModel";

export type AuthResultModel =
    | { success: true, user: UserDBModel }
    | { success: false, error: string, statusCode: number }