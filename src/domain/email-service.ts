import {emailManager} from "../managers/email-manager";
import {usersRepository} from "../repositories/users/users-repository";

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
    }
}