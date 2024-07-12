import {Entity, belongsTo, model, property} from '@loopback/repository';
import {AccountPayableHistoryStatusE} from '../enums';
import {AccountPayable} from './account-payable.model';
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
export class AccountPayableHistory extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  // Fecha proforma
  @property({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  proformaDate: Date;

  // No. Proforma
  @property({
    type: 'string',
    required: true,
  })
  proformaNumber: string;

  // Moneda
  @property({
    type: 'string',
    required: true,
  })
  currency: string;

  // Importe proforma
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },

  })
  proformaAmount: number;


  // Fecha de pago
  @property({
    type: 'date',
    required: true,
    default: () => new Date(),

  })
  paymentDate: Date;

  // Monto anticipo
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  advancePaymentAmount: number;

  // Saldo
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  balance: number;

  // Estatus
  @property({
    type: 'string',
    required: true,
    default: AccountPayableHistoryStatusE.PENDIENTE
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
