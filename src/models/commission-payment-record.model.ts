import {Entity, belongsTo, model, property} from '@loopback/repository';
import {CommissionPaymentStatus} from '../enums';
import {Project} from './project.model';
import {User} from './user.model';

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

    @belongsTo(() => User)
    userId: number;

    @belongsTo(() => Project)
    projectId: number;

    //Porcentaje de comision
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    commissionPercentage: number;

    //Monto de comision
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    commissionAmount: number;

    //Total del proyecto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    projectTotal: number;

    //Estatus del pago
    @property({
        type: 'string',
        required: false,
        default: CommissionPaymentStatus.PENDIENTE
    })
    status: CommissionPaymentStatus;

    constructor(data?: Partial<CommissionPaymentRecord>) {
        super(data);
    }
}

export interface CommissionPaymentRecordRelations {
    // describe navigational properties here
}

export type CommissionPaymentRecordWithRelations = CommissionPaymentRecord & CommissionPaymentRecordRelations;
