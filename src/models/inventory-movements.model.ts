import {belongsTo, Entity, model, property} from '@loopback/repository';
import {InventoriesIssueE, InventoriesReasonE, InventoryMovementsTypeE} from '../enums';
import {Collection} from './collection.model';
import {Container} from './container.model';
import {Inventories, InventoriesWithRelations} from './inventories.model';
import {Project} from './project.model';
import {User, UserWithRelations} from './user.model';

@model({
    settings: {
        postgresql: {
            table: 'inventories_InventoryMovements' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_project_projectid: {
                name: 'fk_project_projectid',
                entity: 'Project',
                entityKey: 'id',
                foreignKey: 'projectid',
            },
            fk_inventories_inventoriesid: {
                name: 'fk_inventories_inventoriesid',
                entity: 'Inventories',
                entityKey: 'id',
                foreignKey: 'inventoriesid',
            },
        }
    }
})
export class InventoryMovements extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    //Cantidad
    @property({
        type: 'number',
    })
    quantity: number;

    //Relacion a proyecto
    @belongsTo(() => Project)
    projectId: number;

    //Tipo (entrada/salida)
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(InventoryMovementsTypeE)],
        },
    })
    type: InventoryMovementsTypeE;

    @belongsTo(() => Inventories)
    inventoriesId: number;

    //Motivo Entrada
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(InventoriesReasonE)],
        },
    })
    reasonEntry: InventoriesReasonE;

    //Motivo Salida
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(InventoriesIssueE)],
        },
    })
    reasonIssue: InventoriesIssueE;

    @belongsTo(() => User)
    createdById: number;

    //Sucursal destino
    @property({
        type: 'number',
    })
    destinationBranchId: number;

    //Bodega destino
    @property({
        type: 'number',
    })
    destinationWarehouseId: number;

    //Comentario
    @property({
        type: 'string',
    })
    comment: string;

    // //Número de contenedor
    // @property({
    //     type: 'string',
    // })
    // containerNumber: string;

    @belongsTo(() => Container)
    containerId: number;

    // //Número de recoleccion
    // @property({
    //     type: 'string',
    // })
    // collectionNumber: string;

    @belongsTo(() => Collection)
    collectionId: number;

    constructor(data?: Partial<InventoryMovements>) {
        super(data);
    }
}

export interface InventoryMovementsRelations {
    // describe navigational properties here
    inventories: InventoriesWithRelations
    createdBy: UserWithRelations
}

export type InventoryMovementsWithRelations = InventoryMovements & InventoryMovementsRelations;
