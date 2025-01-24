import {Entity, belongsTo, model, property} from '@loopback/repository';
import {CurrencyE} from '../enums';
import {Product} from './product.model';
import {Provider, ProviderWithRelations} from './provider.model';

@model({
    settings: {
        postgresql: {
            table: 'product_ProductProvider' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_product_productId: {
                name: 'fk_product_productId',
                entity: 'Product',
                entityKey: 'id',
                foreignKey: 'productid',
            },
        }
    }
})
export class ProductProvider extends Entity {
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

    @belongsTo(() => Provider)
    providerId: number;

    @belongsTo(() => Product)
    productId: number;

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

    constructor(data?: Partial<ProductProvider>) {
        super(data);
    }
}

export interface ProductProviderRelations {
    // describe navigational properties here
    provider: ProviderWithRelations
}

export type ProductProviderWithRelations = ProductProvider & ProductProviderRelations;
