import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import fs from "fs/promises";
import HtmlToPdf, {Options} from 'html-pdf-node';

@injectable({scope: BindingScope.TRANSIENT})
export class PdfService {
    constructor(

    ) { }

    async createPDFWithTemplateHtml(pathTemplate: string, properties: {name: string, value: string}[], options: Options) {
        try {
            let html = await fs.readFile(pathTemplate, "utf-8");
            for (const iterator of properties) {
                html = html.replace(`{{${iterator.name}}}`, iterator.value);
            }
            let file = {content: html};
            return this.generatePdf(file, options);
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
