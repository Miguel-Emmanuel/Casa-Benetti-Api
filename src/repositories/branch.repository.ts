import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Branch, BranchRelations} from '../models';
import {OperationHook} from '../operation-hooks';

export class BranchRepository extends DefaultCrudRepository<
  Branch,
  typeof Branch.prototype.id_branch,
  BranchRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
  ) {
    super(Branch, dataSource);
    this.definePersistedModel(Branch)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.USER);
    });

  }
}
