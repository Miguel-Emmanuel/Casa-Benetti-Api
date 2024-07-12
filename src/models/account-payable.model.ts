import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {ExchangeRateQuotationE} from '../enums';
import {AccountPayableHistory} from './account-payable-history.model';
import {BaseEntity} from './base/base-entity.model';
import {Proforma, ProformaWithRelations} from './proforma.model';
import {PurchaseOrders} from './purchase-orders.model';

@model({
  settings: {
    postgresql: {
      table: 'proforma_AccountPayable' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_accountPayable_proformaId: {
        name: 'fk_accountPayable_proformaId',
        entity: 'Proforma',
        entityKey: 'id',
        foreignKey: 'proformaid',
      },
    }
  }
})
export class AccountPayable extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  // Moneda
  @property({
    type: 'string',
    required: true,
  })
  currency: ExchangeRateQuotationE;


  //Monto a pagar
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  total: number;

  //Total pagado
  @property({
    type: 'number',
    postgresql: {
      dataType: 'double precision',
    },
    default: 0
  })
  totalPaid: number;

  //Saldo
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
    default: 0

  })
  balance: number;

  @hasOne(() => PurchaseOrders)
  purchaseOrders: PurchaseOrders;

  @belongsTo(() => Proforma)
  proformaId: number;

  @hasMany(() => AccountPayableHistory)
  accountPayableHistories: AccountPayableHistory[];

  constructor(data?: Partial<AccountPayable>) {
    super(data);
  }
}

export interface AccountPayableRelations {
  // describe navigational properties here
  proforma: ProformaWithRelations
}

export type AccountPayableWithRelations = AccountPayable & AccountPayableRelations;
