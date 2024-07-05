import {Entity, belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {TypeArticleE, UOME} from '../enums';
import {AssembledProducts} from './assembled-products.model';
import {BaseEntity} from './base/base-entity.model';
import {Brand, BrandWithRelations} from './brand.model';
import {Classification} from './classification.model';
import {Document} from './document.model';
import {Line} from './line.model';
import {Organization} from './organization.model';
import {ProviderWithRelations} from './provider.model';
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

    //*********** ACTUALIZACION DE PRODUCTOS ***************

    //Generales

    //Fotografia
    @hasOne(() => Document)
    document: Document;

    //Marca
    @belongsTo(() => Brand)
    brandId?: number;

    //Clasificacion
    @belongsTo(() => Classification)
    classificationId?: number;

    //Linea
    @belongsTo(() => Line)
    lineId?: number;

    //Nombre del producto
    @property({
        type: 'string',
    })
    name: string;

    //Tipo de articulo
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(TypeArticleE)]
        }
    })
    typeArticle: TypeArticleE;

    //UOM
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(UOME)]
        }
    })
    UOM: UOME;

    //Información de compra

    //Se puede comprar?
    @property({
        type: 'boolean',
    })
    isPurchasable: boolean;

    //Pais de origen
    @property({
        type: 'string',
    })
    countryOrigin: string;

    //AGREGAR ARRAY DE PROVEEDORES


    //Venta

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

    //Descuento maximo
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    discount: number;

    //CATSAT
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

    //*********** FIN ACTUALIZACION DE PRODUCTOS ***************

    @hasMany(() => AssembledProducts)
    assembledProducts: AssembledProducts[];

    @belongsTo(() => Organization)
    organizationId: number;

    @hasMany(() => Quotation, {through: {model: () => QuotationProducts}})
    quotations: Quotation[];

    @hasOne(() => QuotationProducts)
    quotationProducts: QuotationProducts;

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
