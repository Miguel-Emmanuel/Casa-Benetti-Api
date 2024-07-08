import {Entity, belongsTo, model, property} from '@loopback/repository';
import {CurrencyE, QuotationProductStatusE, TypeSaleE} from '../enums';
import {Product} from './product.model';
import {Provider} from './provider.model';

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

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    @property({
        type: 'number',
    })
    quotationId?: number;

    @belongsTo(() => Product)
    productId: number;

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
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageSeparate?: number;

    //Dias de apartado
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    reservationDays?: number;

    //Cantidad por producto
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    quantity: number;

    @belongsTo(() => Provider)
    providerId: number;

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
    })
    discountProduct: number;

    //Descuento adicional porcentaje
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdditionalDiscount: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    additionalDiscount: number;

    //Subtotal con descuento
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotal: number;

    //Status
    @property({
        type: 'string',
    })
    status?: QuotationProductStatusE;

    //Moneda de compra
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(CurrencyE)]
        }
    })
    currency: CurrencyE;


    constructor(data?: Partial<QuotationProducts>) {
        super(data);
    }
}

export interface QuotationProductsRelations {
    // describe navigational properties here
}

export type QuotationProductsWithRelations = QuotationProducts & QuotationProductsRelations;
