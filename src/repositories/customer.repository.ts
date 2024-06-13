import {Getter, inject} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Customer, CustomerRelations} from '../models';
import {OperationHook} from '../operation-hooks';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class CustomerRepository extends SoftCrudRepository<
  Customer,
  typeof Customer.prototype.id,
  CustomerRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
  ) {
    super(Customer, dataSource);
    this.definePersistedModel(Customer)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.CUSTOMER);
    });
  }
}
