import {belongsTo, Entity, model, property} from '@loopback/repository';
import {TypeSaleE} from '../enums';
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

    //Venta o prestamo
    @property({
        type: 'string',
    })
    typeSale?: TypeSaleE;

    //Dias de reservacion
    @property({
        type: 'number',
    })
    reservationDays: number;

    //Fecha de reservacion
    @property({
        type: 'date',
    })
    dateReservationDays?: Date;

    //Fecha inicial del préstamo
    @property({
        type: 'date',
    })
    loanInitialDate: Date;

    //Fecha final del préstamo
    @property({
        type: 'date',
    })
    loanEndDate: Date;

    //cantidad
    @property({
        type: 'number',
    })
    quantity: number;

    //Notificacion para dias de reservacion enviada
    @property({
        type: 'boolean',
    })
    isNotificationSent?: boolean | null;

    constructor(data?: Partial<QuotationProductsStock>) {
        super(data);
    }
}

export interface QuotationProductsStockRelations {
    // describe navigational properties here
}

export type QuotationProductsStockWithRelations = QuotationProductsStock & QuotationProductsStockRelations;
