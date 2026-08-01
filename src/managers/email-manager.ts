import nodemailer from "nodemailer";
import {
    emailConfig,
    emailTransport,
    emailFrom,
    resendApiKey,
    isEmailConfigured,
    describeEmailConfig,
} from "../configs/email-config";
import {emailAdapter} from "../adapters/email-adapter";
import {resendAdapter} from "../adapters/resend-adapter";
import {EmailInfoModel} from "../models/email/EmailInfoModel";
import {htmlManager} from "./html-manager";

// Built lazily: creating a transport when SMTP is not the chosen path would
// open a connection Render is going to block anyway.
let transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: emailConfig.auth,
        })
    }
    return transporter
}

export const emailManager = {
    async sendEmail(emailInfo: EmailInfoModel): Promise<boolean> {
        if (!isEmailConfigured) {
            console.error("[Email] Cannot send —", describeEmailConfig())
            return false
        }
        try {
          const replacements = {
              email: emailInfo.email,
              userName: emailInfo.userName,
              subject: emailInfo.subject,
              message: emailInfo.message,
              link: emailInfo.link,
              articleImage: emailInfo.articleImage,
              buttonText: emailInfo.buttonText
          }

          const htmlToSend = await htmlManager.generateHTML(
              "./src/templates/email/universalEmail.html", replacements)

            const from = `Charitylife <${emailFrom}>`

            if (emailTransport === "resend") {
                return await resendAdapter.sendEmail({
                    apiKey: resendApiKey,
                    from,
                    to: emailInfo.email,
                    subject: emailInfo.subject,
                    html: htmlToSend,
                })
            }

            return await emailAdapter.sendEmail(getTransporter(), {
                from,
                to: emailInfo.email,
                subject: emailInfo.subject,
                html: htmlToSend,
            })
        } catch (err) {
            console.log("Error sending notification email:", err)
            console.error("[Email]", describeEmailConfig())
            return false
        }
    }
}
