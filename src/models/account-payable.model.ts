import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {ExchangeRateQuotationE} from '../enums';
import {AccountPayableHistory} from './account-payable-history.model';
import {BaseEntity} from './base/base-entity.model';
import {Proforma} from './proforma.model';

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
}

export type AccountPayableWithRelations = AccountPayable & AccountPayableRelations;
