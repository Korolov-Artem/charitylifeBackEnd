import bcrypt from 'bcrypt';
import {UserDBModel} from "../models/users/UserDBModel";
import {ObjectId} from "mongodb";
import {usersRepository} from "../repositories/users/users-repository";
import {v4 as uuidv4} from 'uuid';
import {add} from "date-fns";
import {emailService} from "./email-service";
import {AuthResultModel} from "../models/auth/AuthResultModel";

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

            const confirmationCode = uuidv4()
            await usersRepository.updateConfirmationCode(user.id, confirmationCode)

            const isNewUser = false
            const emailSent = await emailService.createAndSendEmailConfirmation(
                email,
                user.accountData.userName,
                user.id,
                confirmationCode,
                isNewUser)
            const errorMessage = emailSent
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

    async checkRecentRegistration(ip: string): Promise<boolean> {
        const recentRegistration: UserDBModel[] = await usersRepository.findRecentUsersByIp(ip)
        return recentRegistration.length > 0
    },

    async _generateHash(password: string, salt: number): Promise<string> {
        return await bcrypt.hash(password, salt)
    },

    async findUserById(id: string): Promise<UserDBModel | null> {
        return await usersRepository.findUserById(id)
    }
}