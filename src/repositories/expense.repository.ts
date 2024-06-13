import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Expense, ExpenseRelations} from '../models';
import {OperationHook} from '../operation-hooks';

export class ExpenseRepository extends DefaultCrudRepository<
  Expense,
  typeof Expense.prototype.id,
  ExpenseRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
  ) {
    super(Expense, dataSource);
    this.definePersistedModel(Expense)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.EXPENSE);
    });
  }
}
