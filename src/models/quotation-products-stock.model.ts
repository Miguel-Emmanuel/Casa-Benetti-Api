import {belongsTo, Entity, model, property} from '@loopback/repository';
import {TypeSaleE} from '../enums';
import {QuotationProducts, QuotationProductsWithRelations} from './quotation-products.model';
import {Quotation, QuotationWithRelations} from './quotation.model';

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


    //Costo Origen (precio de lista)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    originCost: number;

    //Factor
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    factor: number;

    //precio (factor * Costo Origen)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    price: number;

    //Subtotal
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotal: number;

    //Descuento porcentaje por producto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageDiscountProduct: number;

    //Descuento por producto total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
        default: 0
    })
    discountProduct: number;

    //Subtotal con descuento
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotalDiscount: number;

    constructor(data?: Partial<QuotationProductsStock>) {
        super(data);
    }
}

export interface QuotationProductsStockRelations {
    // describe navigational properties here
    quotationProducts: QuotationProductsWithRelations
    quotation: QuotationWithRelations
}

export type QuotationProductsStockWithRelations = QuotationProductsStock & QuotationProductsStockRelations;
