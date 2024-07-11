import {hasMany, model, property} from '@loopback/repository';
import {ExchangeRateQuotationE} from '../enums';
import {AccountPayableHistory} from './account-payable-history.model';
import {BaseEntity} from './base/base-entity.model';

@model({
  settings: {
    postgresql: {
      table: 'project_AccountPayable' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_accountPayable_projectId: {
        name: 'fk_accountPayable_projectId',
        entity: 'Project',
        entityKey: 'id',
        foreignKey: 'projectid',
      },
      fk_accountPayable_quotationId: {
        name: 'fk_accountPayable_quotationId',
        entity: 'Quotation',
        entityKey: 'id',
        foreignKey: 'quotationid',
      },
      fk_accountPayable_customerId: {
        name: 'fk_accountPayable_customerId',
        entity: 'Customer',
        entityKey: 'id',
        foreignKey: 'customerid',
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
