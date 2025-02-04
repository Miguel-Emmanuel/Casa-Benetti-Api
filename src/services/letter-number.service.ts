import { /* inject, */ BindingScope, injectable} from '@loopback/core';

@injectable({scope: BindingScope.TRANSIENT})
export class LetterNumberService {
    constructor(

    ) { }

    convertNumberToWords(amount: number): string {
        const units: string[] = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const special: string[] = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiún', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
        const tens: string[] = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const hundreds: string[] = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        function convertUnits(num: number): string {
            return units[num];
        }

        function convertTens(num: number): string {
            if (num < 10) return convertUnits(num);
            else if (num >= 10 && num < 30) return special[num - 10];
            else {
                const ten = Math.floor(num / 10);
                const unit = num % 10;
                if (unit === 0) return tens[ten];
                else return `${tens[ten]} y ${convertUnits(unit)}`;
            }
        }

        function convertHundreds(num: number): string {
            const hundred = Math.floor(num / 100);
            const remainder = num % 100;
            if (num >= 100) {
                if (remainder === 0) return hundreds[hundred];
                if (hundred === 1) return `ciento ${convertTens(remainder)}`;
                return `${hundreds[hundred]} ${convertTens(remainder)}`;
            }
            return convertTens(num);
        }

        function convertThousands(num: number): string {
            const thousand = Math.floor(num / 1000);
            const remainder = num % 1000;
            if (thousand === 0) return convertHundreds(remainder);
            if (thousand === 1) return `mil ${convertHundreds(remainder)}`;
            return `${convertHundreds(thousand)} mil ${convertHundreds(remainder)}`;
        }

        function convertMillions(num: number): string {
            const million = Math.floor(num / 1000000);
            const remainder = num % 1000000;
            if (million === 0) return convertThousands(remainder);
            if (million === 1) return `un millón ${convertThousands(remainder)}`;
            return `${convertHundreds(million)} millones ${convertThousands(remainder)}`;
        }

        // Separar la parte entera y los centavos
        const [whole, cents] = amount.toFixed(2).split('.');

        if (parseInt(whole) === 0) return `cero pesos ${cents}/100 MN`;
        if (parseInt(whole) === 1) return `un peso ${cents}/100 MN`;

        // Convertir la parte entera a palabras
        const wholeInWords = convertMillions(parseInt(whole));

        return wholeInWords.trim().toUpperCase();
    }

}
