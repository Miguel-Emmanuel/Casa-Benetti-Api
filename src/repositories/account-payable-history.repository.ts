import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayableHistory, AccountPayableHistoryRelations, AccountPayable, Provider} from '../models';
import {AccountPayableRepository} from './account-payable.repository';
import {ProviderRepository} from './provider.repository';

export class AccountPayableHistoryRepository extends DefaultCrudRepository<
  AccountPayableHistory,
  typeof AccountPayableHistory.prototype.id,
  AccountPayableHistoryRelations
> {

  public readonly accountPayable: BelongsToAccessor<AccountPayable, typeof AccountPayableHistory.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof AccountPayableHistory.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('AccountPayableRepository') protected accountPayableRepositoryGetter: Getter<AccountPayableRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(AccountPayableHistory, dataSource);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.accountPayable = this.createBelongsToAccessorFor('accountPayable', accountPayableRepositoryGetter,);
    this.registerInclusionResolver('accountPayable', this.accountPayable.inclusionResolver);
  }
}
