import {Entity, belongsTo, hasOne, model, property} from '@loopback/repository';
import {CurrencyE, QuotationProductStatusE} from '../enums';
import {DocumentSchema} from './base/document.model';
import {Document} from './document.model';
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
            fk_provider_providerId: {
                name: 'fk_provider_providerId',
                entity: 'Provider',
                entityKey: 'id',
                foreignKey: 'providerid',
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
    id: number;

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

    //******************************************** ACTUALIZACION DE PRODUCTOS ***************

    //sku
    @property({
        type: 'string',
    })
    SKU: string;

    //Materia principal
    @property({
        type: 'string',
    })
    mainMaterial: string;

    //Materia principal imagen
    @hasOne(() => Document, {keyTo: 'mainMaterialId'})
    mainMaterialImage: Document;

    //Acabado principal
    @property({
        type: 'string',
    })
    mainFinish: string;

    //Acabado principal imagen
    @hasOne(() => Document, {keyTo: 'mainFinishId'})
    mainFinishImage: Document;

    //Material secundario
    @property({
        type: 'string',
    })
    secondaryMaterial: string;

    //Material secundario Image
    @hasOne(() => Document, {keyTo: 'secondaryMaterialId'})
    secondaryMaterialImage: Document;

    //Acabado secundario
    @property({
        type: 'string',
    })
    secondaryFinishing: string;

    //Acabado secundario imagen
    @hasOne(() => Document, {keyTo: 'secondaryFinishingId'})
    secondaryFinishingImage: Document;

    //Medidas
    @property({
        type: 'string',
    })
    measures: string;

    //Proveedor
    @belongsTo(() => Provider)
    providerId: number;

    //Modelo/nombre origen
    @property({
        type: 'string',
    })
    model: string;

    //Codigo de origen
    @property({
        type: 'string',
    })
    originCode: string;

    //Costo Origen (precio de lista)
    @property({
        type: 'number',
    })
    originCost: number;

    //Moneda de compra
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(CurrencyE)]
        }
    })
    currency: CurrencyE;

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

    //Descuento porcentaje maximo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageMaximumDiscount: number;

    //Descuento maximo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    maximumDiscount: number;

    //Cantidad por producto
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    quantity: number;

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

    //Ubicacion
    @property({
        type: 'string',
    })
    location: string;

    //Status
    @property({
        type: 'string',
        default: QuotationProductStatusE.PEDIDO
    })
    status: QuotationProductStatusE;

    //******************************************** FIN ACTUALIZACION DE PRODUCTOS ***************

    constructor(data?: Partial<QuotationProducts>) {
        super(data);
    }
}

export interface QuotationProductsRelations {
    // describe navigational properties here
}

export type QuotationProductsWithRelations = QuotationProducts & QuotationProductsRelations;


export class QuotationProductsCreate extends QuotationProducts {
    @property({
        type: 'object',
    })
    mainMaterialImg?: DocumentSchema;

    @property({
        type: 'object',
    })
    mainFinishImg?: DocumentSchema;

    @property({
        type: 'object',
    })
    secondaryMaterialImg?: DocumentSchema;

    @property({
        type: 'object',
    })
    secondaryFinishingImag?: DocumentSchema;
}
