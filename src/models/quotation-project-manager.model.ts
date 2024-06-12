import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'quotation_QuotationProjectManager' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class QuotationProjectManager extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'number',
    })
    quotationId?: number;

    @property({
        type: 'number',
    })
    userId?: number;

    //Comision del proyect manager
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentageProjectManager: number;

    constructor(data?: Partial<QuotationProjectManager>) {
        super(data);
    }
}

export interface QuotationProjectManagerRelations {
    // describe navigational properties here
}

export type QuotationProjectManagerWithRelations = QuotationProjectManager & QuotationProjectManagerRelations;
