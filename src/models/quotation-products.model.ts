import {Entity, belongsTo, hasOne, model, property} from '@loopback/repository';
import {CurrencyE, QuotationProductStatusE} from '../enums';
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
    id?: number;

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

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

    //Costo Origen
    @property({
        type: 'string',
    })
    originCost: string;

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
    })
    status?: QuotationProductStatusE;

    //******************************************** FIN ACTUALIZACION DE PRODUCTOS ***************

    @property({
        type: 'number',
    })
    quotationId?: number;

    @belongsTo(() => Product)
    productId: number;


    constructor(data?: Partial<QuotationProducts>) {
        super(data);
    }
}

export interface QuotationProductsRelations {
    // describe navigational properties here
}

export type QuotationProductsWithRelations = QuotationProducts & QuotationProductsRelations;
