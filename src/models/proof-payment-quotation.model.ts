import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE} from '../enums';
import {DocumentSchema} from './base/document.model';
import {Document} from './document.model';
import {Quotation} from './quotation.model';

//Comprobante de anticipo de la cotizacion
@model({
    settings: {
        postgresql: {
            table: 'quotation_ProofPaymentQuotation' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class ProofPaymentQuotation extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    @hasMany(() => Document)
    documents: Document[];

    //Fecha de pago
    @property({
        type: 'date',
    })
    paymentDate: Date;

    //Tipo de pago
    @property({
        type: 'string',
    })
    paymentType: PaymentTypeProofE;

    //Tipo de comprobante
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(ExchangeRateQuotationE)]
        }
    })
    proofPaymentType: ExchangeRateQuotationE;

    //Tipo de cambio
    @property({
        type: 'string',
    })
    exchangeRate: ExchangeRateE;

    //Tipo de cambio monto (valor de la moneda que se selecciono)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    exchangeRateAmount: number;

    //Anticipo cliente
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceCustomer: number;

    //Anticipo Conversión
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    conversionAdvance: number;

    //Cotizacion
    @belongsTo(() => Quotation)
    quotationId: number;

    constructor(data?: Partial<ProofPaymentQuotation>) {
        super(data);
    }
}

export interface ProofPaymentQuotationRelations {
    // describe navigational properties here
}

export type ProofPaymentQuotationWithRelations = ProofPaymentQuotation & ProofPaymentQuotationRelations;

export class ProofPaymentQuotationCreate extends ProofPaymentQuotation {
    @property({
        type: 'array',
        jsonSchema: {
            type: 'array',
            items: getJsonSchema(DocumentSchema)
        }
    })
    images: DocumentSchema[];
}
