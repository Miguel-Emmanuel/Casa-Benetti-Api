import {Entity, model, property} from '@loopback/repository';
import {CommissionPaymentStatus} from '../enums';

@model({
    settings: {
        postgresql: {
            table: 'commissionPaymentRecord_CommissionPayment' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class CommissionPayment extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    //Fecha de pago
    @property({
        type: 'date',
    })
    paymentDate: Date;

    @property({
        type: 'number',
    })
    commissionPaymentRecordId?: number;

    //Monto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    amount: number;

    //Estatus del pago
    @property({
        type: 'string',
        required: false,
        default: CommissionPaymentStatus.PENDIENTE
    })
    status: CommissionPaymentStatus;


    constructor(data?: Partial<CommissionPayment>) {
        super(data);
    }
}

export interface CommissionPaymentRelations {
    // describe navigational properties here
}

export type CommissionPaymentWithRelations = CommissionPayment & CommissionPaymentRelations;
