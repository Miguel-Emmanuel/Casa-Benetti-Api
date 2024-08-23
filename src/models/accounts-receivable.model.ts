import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {AdvancePaymentRecord} from './advance-payment-record.model';
import {Customer} from './customer.model';
import {Project, ProjectWithRelations} from './project.model';
import {Quotation} from './quotation.model';

//Cuentas por cobrar
@model({
    settings: {
        postgresql: {
            table: 'project_AccountsReceivable' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_project_projectId: {
                name: 'fk_project_projectId',
                entity: 'Project',
                entityKey: 'id',
                foreignKey: 'projectid',
            },
            fk_project_customerId: {
                name: 'fk_project_customerId',
                entity: 'Customer',
                entityKey: 'id',
                foreignKey: 'customerid',
            },
            fk_quotation_quotationId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
        }
    }
})
export class AccountsReceivable extends Entity {
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
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalPaid: number;

    //Total actualizado
    @property({
        type: 'number',
        required: false,
        default: 0,
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


    //Tipo de moneda ExchangeRateQuotationE
    @property({
        type: 'string',
    })
    typeCurrency: string
    // typeCurrency: ExchangeRateQuotationE


    constructor(data?: Partial<AccountsReceivable>) {
        super(data);
    }
}

export interface AccountsReceivableRelations {
    // describe navigational properties here
    project: ProjectWithRelations
}

export type AccountsReceivableWithRelations = AccountsReceivable & AccountsReceivableRelations;
