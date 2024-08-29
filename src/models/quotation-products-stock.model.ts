import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'quotation_QuotationProductsStock' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class QuotationProductsStock extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'number',
    })
    quotationProductsId?: number;

    @property({
        type: 'number',
    })
    quotationId?: number;

    constructor(data?: Partial<QuotationProductsStock>) {
        super(data);
    }
}

export interface QuotationProductsStockRelations {
    // describe navigational properties here
}

export type QuotationProductsStockWithRelations = QuotationProductsStock & QuotationProductsStockRelations;
