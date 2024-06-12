import {Entity, model, property} from '@loopback/repository';

@model()
export class QuotationDesigner extends Entity {
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

    //Comision del potectista
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentageDesigner: number;

    constructor(data?: Partial<QuotationDesigner>) {
        super(data);
    }
}

export interface QuotationDesignerRelations {
    // describe navigational properties here
}

export type QuotationDesignerWithRelations = QuotationDesigner & QuotationDesignerRelations;
