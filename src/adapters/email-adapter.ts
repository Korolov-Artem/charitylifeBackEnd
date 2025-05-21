import {Transporter} from "nodemailer";
import {MailOptions} from "nodemailer/lib/smtp-pool";

export const emailAdapter = {
    async sendEmail(transporter: Transporter, mailOptions: MailOptions): Promise<boolean> {
        try {
            await transporter.sendMail(mailOptions)
            return true
        } catch (err) {
            console.log("Error in sendEmail:", err)
            return false
        }
    }
}