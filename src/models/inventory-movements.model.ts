import {belongsTo, Entity, model, property} from '@loopback/repository';
import {InventoriesReasonE, InventoryMovementsTypeE} from '../enums';
import {Inventories} from './inventories.model';
import {Project} from './project.model';

@model()
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
    })
    type: InventoryMovementsTypeE;

    @belongsTo(() => Inventories)
    inventoriesId: number;

    //Motivo
    @property({
        type: 'string',
    })
    reason: InventoriesReasonE;

    //Número de contenedor
    @property({
        type: 'string',
    })
    containerNumber: string;

    //Número de recoleccion
    @property({
        type: 'string',
    })
    collectionNumber: string;

    constructor(data?: Partial<InventoryMovements>) {
        super(data);
    }
}

export interface InventoryMovementsRelations {
    // describe navigational properties here
}

export type InventoryMovementsWithRelations = InventoryMovements & InventoryMovementsRelations;
