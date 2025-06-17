import bcrypt from 'bcrypt';
import {RefreshTokenMeta, UserDBModel} from "../models/users/UserDBModel";
import {ObjectId} from "mongodb";
import {usersRepository} from "../repositories/users/users-repository";
import {v4 as uuidv4} from 'uuid';
import {add} from "date-fns";
import {emailService} from "./email-service";
import {AuthResultModel} from "../models/auth/AuthResultModel";
import {jwtService} from "../application/jwt-service";
import {AuthResetPasswordTokenModel} from "../models/auth/AuthResetPasswordTokenModel";
import {AuthResetPasswordResponseModel} from "../models/auth/AuthResetPasswordResponseModel";

export const usersService = {
    async createUser(email: string, password: string,
                     userName: string, userIpAddress: string): Promise<string | false> {
        const hasRecentRegistration = await this.checkRecentRegistration(userIpAddress)
        if (hasRecentRegistration) return false
        const possibleUser: UserDBModel | null = await usersRepository.findUserByEmail(email);
        if (possibleUser) return false

        const passwordHash: string = await this._generateHash(password, 10);

        const newUser: UserDBModel = {
            id: new ObjectId().toString(),
            accountData: {
                email,
                userName,
                passwordHash,
                createdAt: new Date()
            },
            emailConfirmation: {
                confirmationCode: uuidv4(),
                expirationDate: add(new Date(), {
                    hours: 1
                }),
                isConfirmed: false,
            },
            registrationData: {
                ip: userIpAddress
            }
        }
        const user: string = await usersRepository.createUser(newUser);
        const isNewUser = true
        const sentEmail: boolean = await emailService.createAndSendEmailConfirmation(
            email, userName, newUser.id, newUser.emailConfirmation.confirmationCode, isNewUser)
        if (sentEmail) {
            return user
        } else {
            return false
        }
    },

    async confirmEmail(email: string, code: string): Promise<boolean> {
        let user: UserDBModel | null = await usersRepository.findUserByEmail(email);
        if (!user) return false
        if (user.emailConfirmation.isConfirmed) return false
        if (user.emailConfirmation.confirmationCode !== code) return false
        if (user.emailConfirmation.expirationDate < new Date()) return false

        return await usersRepository.updateConfirmation(user.id)
    },

    async checkCredentials(email: string, password: string):
        Promise<AuthResultModel> {
        const user: UserDBModel | null = await usersRepository.findUserByEmail(email);
        if (!user) {
            return {success: false, error: "Invalid credentials", statusCode: 401}
        }

        if (!user.emailConfirmation.isConfirmed) {
            const recentConfirmationEmails = await
                usersRepository.findRecentUserConfirmationEmailsById(user.id)
            if (recentConfirmationEmails) {
                return {
                    success: false, error: "Confirmation email has already been sent." +
                        " Check your spam box, or try again later", statusCode: 429
                }
            }

            const confirmationCode: string = uuidv4()
            await usersRepository.updateConfirmationCode(user.id, confirmationCode)

            const isNewUser = false
            const emailSent: boolean = await emailService.createAndSendEmailConfirmation(
                email,
                user.accountData.userName,
                user.id,
                confirmationCode,
                isNewUser)
            const errorMessage: string = emailSent
                ? "Your email address is not yet confirmed. We've sent you a confirmation letter," +
                " please proceed to your mailbox and follow the instructions attached."
                : "Something went wrong while sending confirmation email, try again later.";
            return {success: false, error: errorMessage, statusCode: 403}
        }

        const isPasswordValid: boolean = await bcrypt.compare(password, user.accountData.passwordHash);
        if (!isPasswordValid) {
            return {success: false, error: "Invalid credentials", statusCode: 401}
        } else {
            return {success: true, user}
        }
    },

    async resetPassword(email: string, id: string) {
        const user: UserDBModel | null = await usersRepository.findUserByEmail(email)
        if (!user) {
            return false
        }
        const userById: UserDBModel | null = await usersRepository.findUserById(id)
        if (userById?.accountData.email != email) {
            return false
        }

        const recentConfirmationEmails: UserDBModel | null = await
            usersRepository.findRecentUserConfirmationEmailsById(user.id)
        if (recentConfirmationEmails) {
            return false
        }

        const passwordResetCode: string = uuidv4()
        await usersRepository.resetPasswordWithATemporaryCode(user.id, passwordResetCode)

        const emailSent: boolean = await emailService.createAndSendPasswordReset(
            email,
            user.accountData.userName,
            user.id,
            passwordResetCode,
        )
        return emailSent
    },

    async resetPasswordWithToken(token: string, newPassword: string): Promise<AuthResetPasswordResponseModel> {
        const tokenData: AuthResetPasswordTokenModel | null | undefined =
            await jwtService.verifyPasswordResetToken(token)
        if (!tokenData) return {success: false, error: "Invalid token data"}
        const user: UserDBModel | null = await usersRepository.findUserById(tokenData.id)
        if (!user || user.accountData.email !== tokenData.email)
            return {success: false, error: "Invalid token data"}
        if (user.accountData.passwordResetCode !== tokenData.code)
            return {success: false, error: "Invalid token data"}

        const noRecentResets = await usersRepository.checkRecentPasswordResetById(user.id)
        if (!noRecentResets) return {success: false, error: "Too many password resets in recent time"}

        const passwordHash: string = await this._generateHash(newPassword, 10);
        await usersRepository.updatePassword(user.id, passwordHash)
        await usersRepository.addRecentPasswordResetById(user.id)
        await usersRepository.clearPasswordResetCode(user.id)
        return {success: true}
    },

    async checkRecentRegistration(ip: string): Promise<boolean> {
        const recentRegistration: UserDBModel[] = await usersRepository.findRecentUsersByIp(ip)
        return recentRegistration.length > 0
    },

    async _generateHash(password: string, salt: number): Promise<string> {
        return await bcrypt.hash(password, salt)
    },

    async findUserById(id: string): Promise<UserDBModel | null> {
        return await usersRepository.findUserById(id)
    },

    async createAuthTokens(email: string, headersDeviceId?: string) {
        const user: UserDBModel | null = await usersRepository.findUserByEmail(email)
        if (!user) return false

        const accessToken = await jwtService.createJWT(user);
        const refreshToken = await jwtService.createRefreshToken(user)
        const finalDeviceId = headersDeviceId || new ObjectId().toString()

        const refreshTokenMeta: RefreshTokenMeta = {
            issuedAt: new Date(),
            deviceId: finalDeviceId,
            userId: user.id
        }

        if (headersDeviceId) {
            await usersRepository.removeOutdatedRefreshToken(user.id, headersDeviceId)
        }

        const updateResult = await
            usersRepository.updateRefreshTokenMeta(refreshTokenMeta, user.id)
        if (!updateResult) return false

        const tokens = {
            accessToken,
            refreshToken,
            deviceId: finalDeviceId
        }

        return tokens
    },

    async verifyRecentLoginAttempts(email: string): Promise<boolean> {
        const recentAttempts: UserDBModel[] = await usersRepository.findRecentLoginsByEmail(email)
        return recentAttempts.length <= 5;
    }
}