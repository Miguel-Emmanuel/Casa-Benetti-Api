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

    //Ubicacion
    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(LocationE)]
        }
    })
    location: LocationE;

    //Tipo de articulo
    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(TypeArticleE)]
        }
    })
    typeArticle: TypeArticleE;

    //Nombre del producto
    @property({
        type: 'string',
        required: true,
    })
    name: string;

    //Descripcion
    @property({
        type: 'string',
        required: false,
    })
    description: string;

    //UOM
    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(UOME)]
        }
    })
    UOM: UOME;

    //Materia principal
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

    //Material secundario
    @property({
        type: 'string',
        required: false,
    })
    secondaryMaterial: string;

    //Acabado secundario
    @property({
        type: 'string',
        required: false,
    })
    secondaryFinishing: string;

    //Pais de origen
    @property({
        type: 'string',
        required: false,
    })
    countryOrigin: string;

    //Se puede comprar?
    @property({
        type: 'boolean',
        required: false,
    })
    isPurchasable: boolean;

    @belongsTo(() => Provider)
    providerId: number;

    //Modelo/nombre origen
    @property({
        type: 'string',
        required: false,
    })
    model: string;

    //Codigo de origen
    @property({
        type: 'string',
        required: false,
    })
    originCode: string;

    //Moneda de compra
    @property({
        type: 'string',
        required: false,
        jsonSchema: {
            enum: [...Object.values(CurrencyE)]
        }
    })
    currency: CurrencyE;

    //Disponible para venta
    @property({
        type: 'boolean',
        required: false,
    })
    isSale: boolean;

    //Factor
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    factor: number;

    //Precio
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    price: number;

    //Descuento maximo
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

    //Fracción arancelaria
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

    //Estatus del producto
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
