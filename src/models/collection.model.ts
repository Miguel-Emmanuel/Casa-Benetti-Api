import {Entity, model, property} from '@loopback/repository';

@model()
export class Collection extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Destino
    @property({
        type: 'string',
    })
    destination: string;

    //Fecha de recoleccion
    @property({
        type: 'date',
    })
    dateCollection: Date


    constructor(data?: Partial<Collection>) {
        super(data);
    }
}

export interface CollectionRelations {
    // describe navigational properties here
}

export type CollectionWithRelations = Collection & CollectionRelations;
