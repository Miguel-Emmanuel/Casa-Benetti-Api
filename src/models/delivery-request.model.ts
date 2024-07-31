import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {DeliveryRequestStatusE} from '../enums';
import {Project} from './project.model';
import {PurchaseOrders} from './purchase-orders.model';

//Solicitud de entrega
@model()
export class DeliveryRequest extends Entity {
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
    createdAt?: Date;

    @hasMany(() => PurchaseOrders)
    purchaseOrders: PurchaseOrders[];

    @belongsTo(() => Project)
    projectId: number;

    //Estatus
    @property({
        type: 'string',
        required: true,
        default: DeliveryRequestStatusE.POR_VALIDAR
    })
    status: DeliveryRequestStatusE;

    constructor(data?: Partial<DeliveryRequest>) {
        super(data);
    }
}

export interface DeliveryRequestRelations {
    // describe navigational properties here
}

export type DeliveryRequestWithRelations = DeliveryRequest & DeliveryRequestRelations;
