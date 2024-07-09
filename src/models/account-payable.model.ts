import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {ExchangeRateQuotationE} from '../enums';
import {Customer} from './customer.model';
import {Project} from './project.model';
import {PurchaseOrders} from './purchase-orders.model';
import {Quotation} from './quotation.model';

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
export class AccountPayable extends Entity {
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

  @belongsTo(() => Project)
  projectId: number;

  @belongsTo(() => Customer)
  customerId: number;

  @hasMany(() => PurchaseOrders)
  purchaseOrders: PurchaseOrders[];

  @belongsTo(() => Quotation)
  quotationId: number;

  constructor(data?: Partial<AccountPayable>) {
    super(data);
  }
}

export interface AccountPayableRelations {
  // describe navigational properties here
}

export type AccountPayableWithRelations = AccountPayable & AccountPayableRelations;
