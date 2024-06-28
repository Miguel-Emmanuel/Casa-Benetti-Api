import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import fs from "fs/promises";
import Handlebars from 'handlebars';
import HtmlToPdf, {Options} from 'html-pdf-node';

@injectable({scope: BindingScope.TRANSIENT})
export class PdfService {
    constructor(

    ) { }

    async createPDFWithTemplateHtml(pathTemplate: string, properties: any, options: Options) {
        try {
            let html = await fs.readFile(pathTemplate, "utf-8");
            var template = Handlebars.compile(html);
            var result = template(properties);
            let file = {content: result};
            return await this.generatePdf(file, options);
        } catch (error) {
            console.log('error: ', error)
        }
    }

    private async generatePdf(file: {content: string}, options: Options) {
        return new Promise((resolve, reject) => {
            HtmlToPdf.generatePdf(file, options, (error, buffer) => {
                if (error) return reject(error);
                return resolve(buffer);
            })
        })
    }

}
