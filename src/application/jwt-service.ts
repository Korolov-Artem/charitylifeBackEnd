import {UserDBModel} from "../models/users/UserDBModel";
import {settings} from "../settings";

const jwt = require('jsonwebtoken');

export const jwtService = {
    async createJWT(user: UserDBModel) {
        return jwt.sign({userId: user.id}, settings.JWT_SECRET, {expiresIn: '3h'})
    },
    async createRefreshToken(user: UserDBModel) {
        return jwt.sign({userId: user.id, email: user.accountData.email},
            settings.JWT_SECRET, {expiresIn: "30d"})
    },
    async getUserIdByToken(token: string) {
        try {
            const result = jwt.verify(token, settings.JWT_SECRET);
            return (result.userId);
        } catch (error) {
            return null;
        }
    },
    async createPasswordResetToken(email: string, id: string, code: string) {
        const payload = {
            email,
            id,
            code,
            type: "password-reset",
            iat: Math.floor(Date.now() / 1000)
        }
        return jwt.sign(payload, settings.JWT_SECRET, {expiresIn: "1h"})
    },
    async verifyPasswordResetToken(token: string) {
        try {
            const decoded = jwt.verify(token, settings.JWT_SECRET)
            if (decoded.type != "password-reset") return null
            return {
                email: decoded.email,
                id: decoded.id,
                code: decoded.code
            }
        } catch (error) {
            console.error("Token verification failed: ", error)
        }
    },
    async verifyAccessTokenExpiration(token: string): Promise<boolean> {
        try {
            const decoded = jwt.verify(token, settings.JWT_SECRET)
            if (!decoded || !decoded.exp) return true
            const currentTime = Math.floor(Date.now() / 1000)
            const bufferTime = 5 * 60
            return decoded.exp < (currentTime + bufferTime)
        } catch (error) {
            return true
        }
    }
}