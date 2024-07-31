import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {DeliveryRequestStatusE} from '../enums';
import {Project} from './project.model';
import {PurchaseOrders} from './purchase-orders.model';

//Solicitud de entrega
@model({
    settings: {
        postgresql: {
            table: 'project_DeliveryRequest' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_project_projectId: {
                name: 'fk_project_projectId',
                entity: 'Project',
                entityKey: 'id',
                foreignKey: 'projectid',
            },
        }
    }
})
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

    //Dia de entrega
    @property({
        type: 'date',
    })
    deliveryDay: Date;

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
