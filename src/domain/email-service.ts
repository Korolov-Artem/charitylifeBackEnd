import {emailManager} from "../managers/email-manager";
import {usersRepository} from "../repositories/users/users-repository";
import {jwtService} from "../application/jwt-service";

// Where the links in outgoing mail point. Both default to localhost, which is
// correct in development and useless in a real inbox — set them in production.
const API_URL = (process.env.PUBLIC_URL || "http://localhost:3000").replace(/\/+$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

export const emailService = {
    async createAndSendEmailConfirmation(
        email: string, userName: string, id: string,
        confirmationCode: string, isNewUser: boolean): Promise<boolean> {

        const emailInfo = {
            email,
            userName,
            subject: "Confirm your email",
            // Points at the API, not the SPA: /auth/confirm-email validates the
            // code and then redirects on to the frontend.
            link: `${API_URL}/auth/confirm-email?email=${
                email}&code=${confirmationCode}`,
            message: "Please confirm your email address by clicking the button below"
        }
        try {
            // sendEmail reports failure by returning false rather than throwing,
            // so the result has to be checked — ignoring it made every failed
            // send look like a delivered one.
            const sent = await emailManager.sendEmail(emailInfo);
            if (!sent) {
                console.error("[Email] Confirmation send failed for", email);
                if (isNewUser) {
                    await usersRepository.deleteUserById(id)
                }
                return false
            }
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
            // Straight to the SPA here — the reset form needs the token itself.
            link: `${FRONTEND_URL}/reset-password?resetToken=${resetToken}`,
            message: "Click the button below to reset your password"
        }
        try {
            const sent = await emailManager.sendEmail(emailInfo);
            if (!sent) {
                console.error("[Email] Password reset send failed for", email);
                return false
            }
            // Shares the confirmation counter so resets are rate-limited too.
            await usersRepository.updateSentEmailConfirmationsById(id)
        } catch (error) {
            console.error(error);
            return false
        }
        return true;
    },
}
