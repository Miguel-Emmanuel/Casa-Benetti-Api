import {belongsTo, Entity, model, property} from '@loopback/repository';
import {QuotationProducts} from './quotation-products.model';
import {Quotation} from './quotation.model';

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

    @belongsTo(() => QuotationProducts)
    quotationProductsId: number;

    @belongsTo(() => Quotation)
    quotationId: number;

    constructor(data?: Partial<QuotationProductsStock>) {
        super(data);
    }
}

export interface QuotationProductsStockRelations {
    // describe navigational properties here
}

export type QuotationProductsStockWithRelations = QuotationProductsStock & QuotationProductsStockRelations;
