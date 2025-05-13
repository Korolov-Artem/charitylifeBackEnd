import {UserDBModel} from "../models/users/UserDBModel";
import {settings} from "../settings";

const jwt = require('jsonwebtoken');

export const jwtService = {
    async createJWT(user: UserDBModel) {
        return jwt.sign({userId: user.id}, settings.JWT_SECRET, {expiresIn: '1d'})
    },
    async getUserIdByToken(token: string) {
        try {
            const result = jwt.verify(token, settings.JWT_SECRET);
            return (result.userId);
        } catch (error) {
            return null;
        }
    }
}