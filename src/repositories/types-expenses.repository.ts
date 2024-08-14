import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {TypesExpenses, TypesExpensesRelations} from '../models';

export class TypesExpensesRepository extends DefaultCrudRepository<
  TypesExpenses,
  typeof TypesExpenses.prototype.id,
  TypesExpensesRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(TypesExpenses, dataSource);
  }
}
