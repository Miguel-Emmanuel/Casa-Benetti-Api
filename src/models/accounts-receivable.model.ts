import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {AdvancePaymentRecord} from './advance-payment-record.model';
import {Customer} from './customer.model';
import {Project} from './project.model';
import {Quotation} from './quotation.model';

//Cuentas por cobrar (Tabla padre de cobros)
@model()
export class AccountsReceivable extends Entity {
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

    //Proyecto id
    @belongsTo(() => Project)
    projectId: number;

    //Cliente id
    @belongsTo(() => Customer)
    customerId: number;

    @hasMany(() => AdvancePaymentRecord)
    advancePaymentRecords: AdvancePaymentRecord[];

    @belongsTo(() => Quotation)
    quotationId: number;

    //Total venta (total de la cotizacion)
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalSale: number;

    //Total pagado (de las cuentas por cobrar)
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalPaid: number;

    //Total actualizado
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    updatedTotal: number;

    //Saldo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    balance: number;


    constructor(data?: Partial<AccountsReceivable>) {
        super(data);
    }
}

export interface AccountsReceivableRelations {
    // describe navigational properties here
}

export type AccountsReceivableWithRelations = AccountsReceivable & AccountsReceivableRelations;
