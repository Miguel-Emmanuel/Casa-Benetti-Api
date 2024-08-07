import {Entity, hasMany, model, property} from '@loopback/repository';
import {PurchaseOrders, PurchaseOrdersWithRelations} from './purchase-orders.model';

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
    id: number;

    //Destino
    @property({
        type: 'string',
    })
    destination: string;

    @hasMany(() => PurchaseOrders)
    purchaseOrders: PurchaseOrdersWithRelations[];

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
