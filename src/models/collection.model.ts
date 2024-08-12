import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Container} from './container.model';
import {Document} from './document.model';
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
    purchaseOrders: PurchaseOrders[];



    //Fecha de recoleccion
    @hasMany(() => Document)
    documents: Document[];

    @property({
        type: 'date',
    })
    dateCollection: Date

    @belongsTo(() => Container)
    containerId?: number;

    // //Número de contenedor
    // @property({
    //     type: 'string',
    // })
    // containerNumber: string;

    constructor(data?: Partial<Collection>) {
        super(data);
    }
}

export interface CollectionRelations {
    // describe navigational properties here
    purchaseOrders: PurchaseOrdersWithRelations[]
}

export type CollectionWithRelations = Collection & CollectionRelations;
