import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayableHistory, AccountPayableHistoryRelations, AccountPayable} from '../models';
import {AccountPayableRepository} from './account-payable.repository';

export class AccountPayableHistoryRepository extends DefaultCrudRepository<
  AccountPayableHistory,
  typeof AccountPayableHistory.prototype.id,
  AccountPayableHistoryRelations
> {

  public readonly accountPayable: BelongsToAccessor<AccountPayable, typeof AccountPayableHistory.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('AccountPayableRepository') protected accountPayableRepositoryGetter: Getter<AccountPayableRepository>,
  ) {
    super(AccountPayableHistory, dataSource);
    this.accountPayable = this.createBelongsToAccessorFor('accountPayable', accountPayableRepositoryGetter,);
    this.registerInclusionResolver('accountPayable', this.accountPayable.inclusionResolver);
  }
}
