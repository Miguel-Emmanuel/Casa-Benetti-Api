import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {AdvancePaymentTypeE, CommissionPaymentRecordStatus} from '../enums';
import {CommissionPayment} from './commission-payment.model';
import {Project, ProjectWithRelations} from './project.model';
import {User, UserWithRelations} from './user.model';

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
    userId?: number;

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

    //Total pagado (de la comision)
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
        default: 0
    })
    totalPaid: number;

    @hasMany(() => CommissionPayment)
    commissionPayments: CommissionPayment[];

    //Porcentaje pagado (de la comision)
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
        default: 0
    })
    percentagePaid: number;

    //Saldo (de la comision)
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    balance: number;

    //Total del proyecto(el valor total de la cotizacion)
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
        default: CommissionPaymentRecordStatus.PENDIENTE
    })
    status: CommissionPaymentRecordStatus;

    //Persona de la comision
    @property({
        type: 'string',
    })
    type: AdvancePaymentTypeE;


    constructor(data?: Partial<CommissionPaymentRecord>) {
        super(data);
    }
}

export interface CommissionPaymentRecordRelations {
    // describe navigational properties here
    user: UserWithRelations
    project: ProjectWithRelations
}

export type CommissionPaymentRecordWithRelations = CommissionPaymentRecord & CommissionPaymentRecordRelations;
