import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayableHistory, AccountPayableHistoryRelations} from '../models';

export class AccountPayableHistoryRepository extends DefaultCrudRepository<
  AccountPayableHistory,
  typeof AccountPayableHistory.prototype.id,
  AccountPayableHistoryRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(AccountPayableHistory, dataSource);
  }
}
