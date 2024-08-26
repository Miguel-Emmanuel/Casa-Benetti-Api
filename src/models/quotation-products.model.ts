import {Entity, belongsTo, hasOne, model, property, referencesMany} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {CurrencyE, QuotationProductStatusE, TypeQuotationE, TypeSaleE} from '../enums';
import {DocumentSchema} from './base/document.model';
import {Branch} from './branch.model';
import {Brand, BrandWithRelations} from './brand.model';
import {Document} from './document.model';
import {Product, ProductWithRelations} from './product.model';
import {Proforma, ProformaWithRelations} from './proforma.model';
import {Provider, ProviderWithRelations} from './provider.model';
import {PurchaseOrders} from './purchase-orders.model';
import {Quotation, QuotationWithRelations} from './quotation.model';

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

    //Número de factura
    @property({
        type: 'string',
    })
    invoiceNumber?: string;

    //Peso bruto
    @property({
        type: 'string',
    })
    grossWeight: string;

    //Peso neto
    @property({
        type: 'string',
    })
    netWeight?: string;

    //No. de cajas o bultos
    @property({
        type: 'number',
        default: 1
    })
    numberBoxes: number;

    //Descripcion del pedimiento
    @property({
        type: 'string',
    })
    descriptionPedimiento?: string;

    //NOM NOM 004, NOM 050
    @property({
        type: 'array',
        itemType: 'string'
    })
    NOMS?: string[];

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    @belongsTo(() => Quotation)
    quotationId: number;

    @belongsTo(() => Product)
    productId: number;

    //Venta o prestamo
    @property({
        type: 'string',
        default: TypeSaleE.VENTA
    })
    typeSale?: TypeSaleE;

    //10 % de apartado
    @property({
        type: 'boolean',
    })
    isMoneySection?: boolean;

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

    //Notificacion para dias de reservacion enviada
    @property({
        type: 'boolean',
    })
    isNotificationSent?: boolean | null;

    //Tipo de cotizacion
    @property({
        type: 'string',
        default: TypeQuotationE.GENERAL
    })
    typeQuotation: TypeQuotationE;


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

    //Medidas (ancho)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    measureWide: number;

    @belongsTo(() => PurchaseOrders)
    purchaseOrdersId: number;

    @referencesMany(() => Branch, {name: 'branches'})
    branchesId: number[];

    //Medidas (alto)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    measureHigh: number;

    //Medidas (profundidad)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    measureDepth: number;

    //Medidas (circuferencia)
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    measureCircumference: number;

    //Peso
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    weight: number;


    //Marca
    @belongsTo(() => Brand)
    brandId: number;

    //Proveedor
    @belongsTo(() => Provider)
    providerId: number;

    //Proforma
    @belongsTo(() => Proforma)
    proformaId: number;

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
        postgresql: {
            dataType: 'double precision',
        },
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

    //Precio proforma
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    proformaPrice: number;

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

    //Comentario de entrada
    @property({
        type: 'string',
    })
    commentEntry: string;

    //Cantidad del producto que ya existe en inventario
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
        default: 0
    })
    stock: number;

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

    @property({
        type: 'array',
        itemType: 'object',
        // jsonSchema: getJsonSchema(AssembledProducts, {exclude: ['SKU', 'isDeleted', 'isActive', 'deleteComment', 'createdAt', 'createdBy', 'updatedBy', 'updatedAt', 'productId']})
        jsonSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'number'
                },
                description: {
                    type: 'string'
                },
                mainMaterial: {
                    type: 'string'
                },
                mainFinish: {
                    type: 'string'
                },
                secondaryMaterial: {
                    type: 'string'
                },
                secondaryFinishing: {
                    type: 'string'
                },
                quantity: {
                    type: 'number'
                },
                document: {
                    type: 'object',
                    properties: {
                        fileURL: {
                            type: 'string'
                        },
                        name: {
                            type: 'string'
                        },
                        extension: {
                            type: 'string'
                        },
                    }
                }
            }
        }
    })
    assembledProducts?: any[];

    //******************************************** FIN ACTUALIZACION DE PRODUCTOS ***************

    constructor(data?: Partial<QuotationProducts>) {
        super(data);
    }
}

export interface QuotationProductsRelations {
    // describe navigational properties here
    product: ProductWithRelations,
    provider: ProviderWithRelations
    brand: BrandWithRelations
    quotation: QuotationWithRelations
    proforma: ProformaWithRelations
}

export type QuotationProductsWithRelations = QuotationProducts & QuotationProductsRelations;


export class QuotationProductsCreate extends QuotationProducts {
    @property({
        type: 'object',
        jsonSchema: getJsonSchema(DocumentSchema)
    })
    mainMaterialImg?: DocumentSchema;

    @property({
        type: 'object',
        jsonSchema: getJsonSchema(DocumentSchema)
    })
    mainFinishImg?: DocumentSchema;

    @property({
        type: 'object',
        jsonSchema: getJsonSchema(DocumentSchema)
    })
    secondaryMaterialImg?: DocumentSchema;

    @property({
        type: 'object',
        jsonSchema: getJsonSchema(DocumentSchema)
    })
    secondaryFinishingImag?: DocumentSchema;

    @property({
        type: 'object',
        jsonSchema: getJsonSchema(DocumentSchema)
    })
    document?: DocumentSchema;

    // @property({
    //     type: 'array',
    //     jsonSchema: {
    //         type: 'array',
    //         items: getJsonSchema(AssembledProducts, {exclude: ['SKU', 'isDeleted', 'isActive', 'deleteComment', 'createdAt', 'createdBy', 'updatedBy', 'updatedAt', 'productId']})
    //     }
    // })
    // assembledProducts?: AssembledProducts[];
}
