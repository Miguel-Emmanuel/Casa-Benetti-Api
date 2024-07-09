import {Entity, belongsTo, model, property} from '@loopback/repository';
import {AccountPayable} from './account-payable.model';

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
    type: 'string',
    required: true,
  })
  proformaDate: string;

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
    type: 'string',
    required: true,
  })
  paymentDate: string;

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
    type: 'number',
    required: true,
  })
  status: number;

  @belongsTo(() => AccountPayable)
  accountPayableId: number;


  constructor(data?: Partial<AccountPayableHistory>) {
    super(data);
  }
}

export interface AccountPayableHistoryRelations {
  // describe navigational properties here
}

export type AccountPayableHistoryWithRelations = AccountPayableHistory & AccountPayableHistoryRelations;
