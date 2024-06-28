import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import fs from "fs/promises";
import Handlebars from 'handlebars';
import HtmlToPdf, {CreateOptions} from 'html-pdf';

@injectable({scope: BindingScope.TRANSIENT})
export class PdfService {
    constructor(

    ) { }

    async createPDFWithTemplateHtml(pathTemplate: string, properties: any, options: CreateOptions, path: string) {
        try {
            let html = await fs.readFile(pathTemplate, "utf-8");
            var template = Handlebars.compile(html);
            var result = template(properties);
            return await this.generatePdf(result, options, path);
        } catch (error) {
            console.log('error: ', error)
        }
    }

    private async generatePdf(result: string, options: CreateOptions, path: string) {
        return new Promise((resolve, reject) => {
            HtmlToPdf.create(result, options).toFile(path, function (err, res) {
                if (err) return reject(err);
                return resolve(res);
            });
        })
        // return new Promise((resolve, reject) => {
        //     HtmlToPdf.generatePdf(file, options, (error, buffer) => {
        //         if (error) return reject(error);
        //         return resolve(buffer);
        //     })
        // })
    }

}
