import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InternalExpenses, InternalExpensesRelations} from '../models';

export class InternalExpensesRepository extends DefaultCrudRepository<
  InternalExpenses,
  typeof InternalExpenses.prototype.id,
  InternalExpensesRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(InternalExpenses, dataSource);
  }
}
