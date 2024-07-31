import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {DeliveryRequestStatusE} from '../enums';
import {Customer} from './customer.model';
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
            fk_customer_customerId: {
                name: 'fk_customer_customerId',
                entity: 'Customer',
                entityKey: 'id',
                foreignKey: 'customerid',
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

    //Comentario
    @property({
        type: 'string',
    })
    comment?: string;

    @hasMany(() => PurchaseOrders)
    purchaseOrders: PurchaseOrders[];

    @belongsTo(() => Customer)
    customerId: number;

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
