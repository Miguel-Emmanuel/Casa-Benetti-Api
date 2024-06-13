import {model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Expense' // Nombre de la tabla en PostgreSQL
    },
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


  constructor(data?: Partial<Expense>) {
    super(data);
  }
}

export interface ExpenseRelations {
  // describe navigational properties here
}

export type ExpenseWithRelations = Expense & ExpenseRelations;
