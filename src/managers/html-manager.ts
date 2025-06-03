import fs from "node:fs";
import {EmailInfoModel} from "../models/email/EmailInfoModel";
import handlebars from "handlebars";

export const htmlManager = {
    async generateHTML(path: string, replacements: EmailInfoModel): Promise<string> {
        const readHTMLFile = async (path: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                fs.readFile(path, {encoding: "utf-8"}, function (err, html) {
                    if (err) return reject(err)
                    resolve(html)
                })
            })
        }
        const html: string = await readHTMLFile(path)
        const template = handlebars.compile(html)
        return template(replacements)
    }
}