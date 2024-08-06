import {Entity, model, property} from '@loopback/repository';

//Programar recolección
@model({
    settings: {
        postgresql: {
            table: 'collection_Collection' // Nombre de la tabla en PostgreSQL
        },
        // foreignKeys: {
        //     fk_project_projectId: {
        //         name: 'fk_project_projectId',
        //         entity: 'Project',
        //         entityKey: 'id',
        //         foreignKey: 'projectid',
        //     },
        // }
    }
})
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
