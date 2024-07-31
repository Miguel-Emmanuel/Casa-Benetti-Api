import {Entity, model, property} from '@loopback/repository';

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


    constructor(data?: Partial<DeliveryRequest>) {
        super(data);
    }
}

export interface DeliveryRequestRelations {
    // describe navigational properties here
}

export type DeliveryRequestWithRelations = DeliveryRequest & DeliveryRequestRelations;
