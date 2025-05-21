import nodemailer from "nodemailer";
import {emailConfig} from "../configs/email-config";
import * as fs from "node:fs";
import * as handlebars from "handlebars";
import {emailAdapter} from "../adapters/email-adapter";

let transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth
})

const readHTMLFile = (path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, {encoding: "utf-8"}, function (err, html) {
            if (err) return reject(err)
            resolve(html)
        })
    })
}

export const emailManager = {
    async sendNotificationEmail(email: string, userName: string, subject: string, message: string): Promise<boolean> {
        const html: string = await readHTMLFile("/Users/jestex/Documents/BlogCode/blog-back-end/src/templates/email/newArticleEmail.html")
        try {
            const template = handlebars.compile(html)
            const replacements = {
                email,
                userName,
                subject,
                message
            }
            const htmlToSend = template(replacements)
            const mailOptions = {
                from: `"Charitylife" <info@charitylife.org>`,
                to: email,
                subject: subject,
                html: htmlToSend
            }
            return await emailAdapter.sendEmail(transporter, mailOptions)
        } catch (err) {
            console.log("Error sending notification email:", err)
            return false
        }
    }
}
