import {Entity, model, property} from '@loopback/repository';
import {TypeSaleE} from '../enums';

@model({
    settings: {
        postgresql: {
            table: 'quotation_QuotationProducts' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_quotation_quotationId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
            fk_product_productId: {
                name: 'fk_product_productId',
                entity: 'Product',
                entityKey: 'id',
                foreignKey: 'productid',
            },
        }
    }
})
export class QuotationProducts extends Entity {
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
    productId?: number;

    //Venta o prestamo
    @property({
        type: 'string',
    })
    typeSale?: TypeSaleE;

    //10 % de apartado
    @property({
        type: 'boolean',
    })
    isSeparate?: boolean;

    //Porcentaje apartado
    @property({
        type: 'boolean',
    })
    percentageSeparate?: number;

    //Dias de apartado
    @property({
        type: 'number',
    })
    reservationDays?: number;

    //Cantidad por producto
    @property({
        type: 'number',
    })
    quantity?: number;

    //Descuento porcentaje por producto
    @property({
        type: 'number',
        required: false,
    })
    percentageDiscountProduct: number;

    //Descuento por producto total
    @property({
        type: 'number',
        required: false,
    })
    discountProduct: number;

    //Descuento adicional porcentaje
    @property({
        type: 'number',
        required: false,
    })
    percentageAdditionalDiscount: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
    })
    additionalDiscount: number;

    //Subtotal con descuento
    @property({
        type: 'number',
        required: false,
    })
    subtotal: number;


    constructor(data?: Partial<QuotationProducts>) {
        super(data);
    }
}

export interface QuotationProductsRelations {
    // describe navigational properties here
}

export type QuotationProductsWithRelations = QuotationProducts & QuotationProductsRelations;
