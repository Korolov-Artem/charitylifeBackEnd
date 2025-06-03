import nodemailer from "nodemailer";
import {emailConfig} from "../configs/email-config";
import {emailAdapter} from "../adapters/email-adapter";
import {EmailInfoModel} from "../models/email/EmailInfoModel";
import {htmlManager} from "./html-manager";

let transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
})

export const emailManager = {
    async sendEmail(emailInfo: EmailInfoModel): Promise<boolean> {
        try {
            const replacements = {
                email: emailInfo.email,
                userName: emailInfo.userName,
                subject: emailInfo.subject,
                message: emailInfo.message,
                link: emailInfo.link
            }

            const htmlToSend = await htmlManager.generateHTML(
                "./src/templates/email/newArticleEmail.html", replacements)

            const mailOptions = {
                from: `"Charitylife" <info@charitylife.org>`,
                to: emailInfo.email,
                subject: emailInfo.subject,
                html: htmlToSend
            }
            return await emailAdapter.sendEmail(transporter, mailOptions)
        } catch (err) {
            console.log("Error sending notification email:", err)
            return false
        }
    }
}
