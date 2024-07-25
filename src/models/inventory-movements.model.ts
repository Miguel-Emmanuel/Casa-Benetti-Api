import {Entity, model, property} from '@loopback/repository';
import {InventoryMovementsTypeE} from '../enums';

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

    //Tipo (entrada/salida)
    @property({
        type: 'string',
    })
    type: InventoryMovementsTypeE;

    constructor(data?: Partial<InventoryMovements>) {
        super(data);
    }
}

export interface InventoryMovementsRelations {
    // describe navigational properties here
}

export type InventoryMovementsWithRelations = InventoryMovements & InventoryMovementsRelations;
