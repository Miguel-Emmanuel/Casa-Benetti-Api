import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {AccountPayableHistoryStatusE, ExchangeRateE} from '../enums';
import {AccountPayable} from './account-payable.model';
import {BaseEntity} from './base/base-entity.model';
import {DocumentSchema} from './base/document.model';
import {Document} from './document.model';
import {Provider, ProviderWithRelations} from './provider.model';

@model({
    settings: {
        postgresql: {
            table: 'accountPayable_AccountPayableHistory' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_accountPayableHistory_accountpayableid: {
                name: 'fk_accountPayableHistory_accountpayableid',
                entity: 'AccountPayable',
                entityKey: 'id',
                foreignKey: 'accountpayableid',
            },
            fk_accountPayableHistory_providerId: {
                name: 'fk_accountPayableHistory_providerId',
                entity: 'Provider',
                entityKey: 'id',
                foreignKey: 'providerid',
            },
        }
    }
})
export class AccountPayableHistory extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    // Concepto
    @property({
        type: 'string',
        required: true,
    })
    concept: string;

    // Moneda
    @property({
        type: 'string',
        required: true,
    })
    currency: ExchangeRateE;

    // Fecha de pago
    @property({
        type: 'date',
        required: true,

    })
    paymentDate: Date;

    @hasMany(() => Document)
    documents: Document[];

    // Monto
    @property({
        type: 'number',
        required: true,
        postgresql: {
            dataType: 'double precision',
        },
    })
    amount: number;

    // Estatus
    @property({
        type: 'string',
        required: true,
        default: AccountPayableHistoryStatusE.PENDIENTE,
        jsonSchema: {
            enum: Object.values(AccountPayableHistoryStatusE),
        },
    })
    status: AccountPayableHistoryStatusE;

    @belongsTo(() => AccountPayable)
    accountPayableId: number;

    @belongsTo(() => Provider)
    providerId: number;

    constructor(data?: Partial<AccountPayableHistory>) {
        super(data);
    }
}

export interface AccountPayableHistoryRelations {
    // describe navigational properties here
    provider: ProviderWithRelations
}

export type AccountPayableHistoryWithRelations = AccountPayableHistory & AccountPayableHistoryRelations;

export class AccountPayableHistoryCreate extends AccountPayableHistory {
    @property({
        type: 'array',
        jsonSchema: {
            type: 'array',
            items: getJsonSchema(DocumentSchema)
        }
    })
    images?: DocumentSchema[];
}
