import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountsReceivable, AccountsReceivableRelations} from '../models';

export class AccountsReceivableRepository extends DefaultCrudRepository<
  AccountsReceivable,
  typeof AccountsReceivable.prototype.id,
  AccountsReceivableRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(AccountsReceivable, dataSource);
  }
}
