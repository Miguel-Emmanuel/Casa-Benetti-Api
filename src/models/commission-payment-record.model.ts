import {Entity, model, property} from '@loopback/repository';

//Registro del pago correspondiente a cada comisión especificada
@model({
    settings: {
        postgresql: {
            table: 'project_CommissionPaymentRecord' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class CommissionPaymentRecord extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    //Nombre del usuario Arquitecto o despacho
    @property({
        type: 'string',
    })
    userName?: string;


    constructor(data?: Partial<CommissionPaymentRecord>) {
        super(data);
    }
}

export interface CommissionPaymentRecordRelations {
    // describe navigational properties here
}

export type CommissionPaymentRecordWithRelations = CommissionPaymentRecord & CommissionPaymentRecordRelations;
