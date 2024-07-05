import {Entity, belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {CurrencyE, StatusProduct, TypeArticleE, UOME} from '../enums';
import {AssembledProducts} from './assembled-products.model';
import {BaseEntity} from './base/base-entity.model';
import {Brand, BrandWithRelations} from './brand.model';
import {Classification} from './classification.model';
import {Document} from './document.model';
import {Line} from './line.model';
import {Organization} from './organization.model';
import {Provider, ProviderWithRelations} from './provider.model';
import {QuotationProducts, QuotationProductsWithRelations} from './quotation-products.model';
import {Quotation} from './quotation.model';

@model()
class DocumentSchema extends Entity {
    @property({
        type: 'string',
    })
    fileURL: string;

    @property({
        type: 'string',
    })
    name: string;

    @property({
        type: 'string',
    })
    extension: string;
}

@model({
    settings: {
        postgresql: {
            table: 'catalog_Product' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_organization_organizationId: {
                name: 'fk_organization_organizationId',
                entity: 'Organization',
                entityKey: 'id',
                foreignKey: 'organizationid',
            },
            fk_provider_providerId: {
                name: 'fk_provider_providerId',
                entity: 'Provider',
                entityKey: 'id',
                foreignKey: 'providerid',
            },
            fk_brand_brandId: {
                name: 'fk_brand_brandId',
                entity: 'Brand',
                entityKey: 'id',
                foreignKey: 'brandid',
            },
        }
    }
})
export class Product extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    @property({
        type: 'string',
    })
    SKU: string;

    // @property({
    //     type: 'string',
    //
    //     jsonSchema: {
    //         enum: [...Object.values(ClassificationE)]
    //     }
    // })
    // classification: ClassificationE;

    // @property({
    //     type: 'string',
    //
    //     jsonSchema: {
    //         enum: [...Object.values(ClassificationE)]
    //     }
    // })
    // line: ClassificationE;
    @belongsTo(() => Classification)
    classificationId?: number;

    @belongsTo(() => Line)
    lineId?: number;

    //Ubicacion
    @property({
        type: 'string',
    })
    location: string;

    //Tipo de articulo
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(TypeArticleE)]
        }
    })
    typeArticle: TypeArticleE;

    // //Productos ensamblado
    // @property({
    //     type: 'array',
    //     itemType: 'object',
    //     jsonSchema: getJsonSchema(AssembledProducts),

    // })
    // assembledProducts: AssembledProducts[];

    @hasMany(() => AssembledProducts)
    assembledProducts: AssembledProducts[];

    //Nombre del producto
    @property({
        type: 'string',
    })
    name: string;

    //Descripcion
    @property({
        type: 'string',
    })
    description: string;

    //UOM
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(UOME)]
        }
    })
    UOM: UOME;

    //Materia principal
    @property({
        type: 'string',
    })
    mainMaterial: string;

    // //Materia principal imagen
    // @property({
    //     type: 'object',
    //     jsonSchema: getJsonSchema(DocumentSchema)
    // })
    // mainMaterialImage: DocumentSchema

    @hasOne(() => Document, {keyTo: 'mainMaterialId'})
    mainMaterialImage: Document;

    //Acabado principal
    @property({
        type: 'string',
    })
    mainFinish: string;

    // //Acabado principal imagen
    // @property({
    //     type: 'object',
    //     jsonSchema: getJsonSchema(DocumentSchema)
    // })
    // mainFinishImage: DocumentSchema

    @hasOne(() => Document, {keyTo: 'mainFinishId'})
    mainFinishImage: Document;

    //Material secundario
    @property({
        type: 'string',
    })
    secondaryMaterial: string;

    // //Material secundario image
    // @property({
    //     type: 'object',
    //     jsonSchema: getJsonSchema(DocumentSchema)
    // })
    // secondaryMaterialImage: DocumentSchema


    @hasOne(() => Document, {keyTo: 'secondaryMaterialId'})
    secondaryMaterialImage: Document;

    //Acabado secundario
    @property({
        type: 'string',
    })
    secondaryFinishing: string;

    // //Acabado secundario image
    // @property({
    //     type: 'object',
    //     jsonSchema: getJsonSchema(DocumentSchema)
    // })
    // secondaryFinishingImage: DocumentSchema

    @hasOne(() => Document, {keyTo: 'secondaryFinishingId'})
    secondaryFinishingImage: Document;

    //Pais de origen
    @property({
        type: 'string',
    })
    countryOrigin: string;

    //Se puede comprar?
    @property({
        type: 'boolean',
    })
    isPurchasable: boolean;

    @belongsTo(() => Provider)
    providerId?: number;

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

    //Moneda de compra
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(CurrencyE)]
        }
    })
    currency: CurrencyE;

    //Disponible para venta
    @property({
        type: 'boolean',
    })
    isSale: boolean;

    //Factor
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    factor: number;

    //Precio
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    price: number;

    //Precio de lista
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    listPrice: number;

    //Descuento maximo
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    discount: number;

    @property({
        type: 'string',
    })
    CATSAT: string;

    //Fracción arancelaria
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    tariffFraction: number;

    @belongsTo(() => Organization)
    organizationId: number;

    @hasOne(() => Document)
    document: Document;

    @hasMany(() => Quotation, {through: {model: () => QuotationProducts}})
    quotations: Quotation[];

    @hasOne(() => QuotationProducts)
    quotationProducts: QuotationProducts;

    // @hasOne(() => QuotationProducts)
    // quotationProducts: QuotationProducts;
    // @hasMany(() => QuotationProducts)
    // quotationProducts: QuotationProducts[];

    @belongsTo(() => Brand)
    brandId?: number;

    //Estatus del producto
    @property({
        type: 'string',
        default: StatusProduct.PEDIDO
    })
    status: StatusProduct;

    @property({
        type: 'boolean',
        default: true
    })
    isActive: boolean;

    @property({
        type: 'string',
    })
    activateDeactivateComment?: string;

    constructor(data?: Partial<Product>) {
        super(data);
    }
}

export interface ProductRelations {
    // describe navigational properties here
    brand: BrandWithRelations
    quotationProducts: QuotationProductsWithRelations
    provider: ProviderWithRelations
}

export type ProductWithRelations = Product & ProductRelations;
