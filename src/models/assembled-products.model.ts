import {hasOne, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Document} from './document.model';

@model({
    settings: {
        postgresql: {
            table: 'product_AssembledProducts' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class AssembledProducts extends BaseEntity {
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

    @property({
        type: 'string',
    })
    description: string;

    @property({
        type: 'string',
    })
    mainMaterial: string;

    //Acabado principal
    @property({
        type: 'string',
    })
    mainFinish: string;

    @property({
        type: 'string',
    })
    secondaryMaterial: string;

    @property({
        type: 'string',
    })
    secondaryFinishing: string;

    @property({
        type: 'number',
    })
    quantity: number;

    @property({
        type: 'boolean',
    })
    isActive: boolean;

    @hasOne(() => Document)
    document: Document;

    @property({
        type: 'number',
    })
    productId: number;

    constructor(data?: Partial<AssembledProducts>) {
        super(data);
    }
}

export interface AssembledProductsRelations {
    // describe navigational properties here
}

export type AssembledProductsWithRelations = AssembledProducts & AssembledProductsRelations;
