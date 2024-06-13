import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {CurrencyE, LocationE, StatusProduct, TypeArticleE, UOME} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {Brand, BrandWithRelations} from './brand.model';
import {Classification} from './classification.model';
import {Document} from './document.model';
import {Line} from './line.model';
import {Organization} from './organization.model';
import {Provider} from './provider.model';
import {QuotationProducts, QuotationProductsWithRelations} from './quotation-products.model';
import {Quotation} from './quotation.model';

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
        required: true,
    })
    SKU: string;

    // @property({
    //     type: 'string',
    //     required: false,
    //     jsonSchema: {
    //         enum: [...Object.values(ClassificationE)]
    //     }
    // })
    // classification: ClassificationE;

    // @property({
    //     type: 'string',
    //     required: false,
    //     jsonSchema: {
    //         enum: [...Object.values(ClassificationE)]
    //     }
    // })
    // line: ClassificationE;

    @belongsTo(() => Classification)
    classificationId: number;

    @belongsTo(() => Line)
    lineId: number;

    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(LocationE)]
        }
    })
    location: LocationE;

    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(TypeArticleE)]
        }
    })
    typeArticle: TypeArticleE;

    @property({
        type: 'string',
        required: true,
    })
    name: string;

    @property({
        type: 'string',
        required: false,
    })
    description: string;

    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(UOME)]
        }
    })
    UOM: UOME;

    @property({
        type: 'string',
        required: false,
    })
    mainMaterial: string;

    //Acabado principal
    @property({
        type: 'string',
        required: false,
    })
    mainFinish: string;

    @property({
        type: 'string',
        required: false,
    })
    secondaryMaterial: string;

    @property({
        type: 'string',
        required: false,
    })
    secondaryFinishing: string;

    @property({
        type: 'string',
        required: false,
    })
    countryOrigin: string;

    @property({
        type: 'boolean',
        required: false,
    })
    isPurchasable: boolean;

    @belongsTo(() => Provider)
    providerId: number;

    @property({
        type: 'string',
        required: false,
    })
    model: string;

    @property({
        type: 'string',
        required: false,
    })
    originCode: string;

    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(CurrencyE)]
        }
    })
    currency: CurrencyE;

    @property({
        type: 'boolean',
        required: false,
    })
    isSale: boolean;

    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    factor: number;

    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    price: number;

    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    discount: number;

    @property({
        type: 'string',
        required: false,
    })
    CATSAT: string;

    @property({
        type: 'number',
        required: false,
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
    brandId: number;

    @property({
        type: 'string',
        required: false,
        default: StatusProduct.PEDIDO
    })
    status: StatusProduct;

    constructor(data?: Partial<Product>) {
        super(data);
    }
}

export interface ProductRelations {
    // describe navigational properties here
    brand: BrandWithRelations
    quotationProducts: QuotationProductsWithRelations
}

export type ProductWithRelations = Product & ProductRelations;
