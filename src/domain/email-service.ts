import {emailManager} from "../managers/email-manager";

export const emailService = {
    async sendNewArticleNotificationEmail(email: string, userName: string, subject: string,
                                          message: string) {
        const result = await emailManager.sendNotificationEmail(email, userName, subject, message)
        return (result)
    }
}