import {Entity, model, property} from '@loopback/repository';

@model()
export class Customer extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;


    constructor(data?: Partial<Customer>) {
        super(data);
    }
}

export interface CustomerRelations {
    // describe navigational properties here
}

export type CustomerWithRelations = Customer & CustomerRelations;
