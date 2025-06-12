import {emailManager} from "../managers/email-manager";
import {usersRepository} from "../repositories/users/users-repository";
import {jwtService} from "../application/jwt-service";

export const emailService = {
    async createAndSendEmailConfirmation(
        email: string, userName: string, id: string,
        confirmationCode: string, isNewUser: boolean): Promise<boolean> {
        const emailInfo = {
            email,
            userName,
            subject: "Confirm your email",
            link: `http://localhost:3000/auth/confirm-email?email=${
                email}&code=${confirmationCode}`,
            message: "Please confirm your email address by clicking the button below"
        }
        try {
            await emailManager.sendEmail(emailInfo);
            await usersRepository.updateSentEmailConfirmationsById(id)
        } catch (error) {
            console.error(error);
            if (isNewUser) {
                await usersRepository.deleteUserById(id)
            }
            return false
        }
        return true;
    },
    async createAndSendPasswordReset(
        email: string, userName: string, id: string,
        passwordResetCode: string): Promise<boolean> {

        const resetToken = await jwtService.createPasswordResetToken(email, id, passwordResetCode)

        const emailInfo = {
            email,
            userName,
            subject: "Password Reset",
            link: `http://localhost:3000/auth/reset-password/initiate?token=${resetToken}`,
            message: "Click the button below to reset your password"
        }
        try {
            await emailManager.sendEmail(emailInfo);
            await usersRepository.updateSentEmailConfirmationsById(id)
        } catch (error) {
            console.error(error);
            return false
        }
        return true;
    },
}