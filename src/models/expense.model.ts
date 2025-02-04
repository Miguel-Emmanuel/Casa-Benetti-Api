import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Organization} from './organization.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Expense' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_expense_organization: {
        name: 'fk_expense_organization',
        entity: 'Organization',
        entityKey: 'id',
        foreignKey: 'organizationid',
      },
    }
  }
})
export class Expense extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  classification?: string;

  @property({
    type: 'string',
  })
  concept?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @belongsTo(() => Organization)
  organizationId: number;

  constructor(data?: Partial<Expense>) {
    super(data);
  }
}

export interface ExpenseRelations {
  // describe navigational properties here
}

export type ExpenseWithRelations = Expense & ExpenseRelations;
