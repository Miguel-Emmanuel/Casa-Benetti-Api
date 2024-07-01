import {Entity, model, property} from '@loopback/repository';

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
    @property({
        type: 'number',
    })
    projectId: number;

    //Cliente id
    @property({
        type: 'number',
    })
    customerId: number;

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
