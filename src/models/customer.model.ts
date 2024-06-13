import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'catalog_Customer' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class Customer extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;


    constructor(data?: Partial<Customer>) {
        super(data);
    }
}

export interface CustomerRelations {
    // describe navigational properties here
}

export type CustomerWithRelations = Customer & CustomerRelations;
