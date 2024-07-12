import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayableHistory, AccountPayableHistoryRelations, AccountPayable, Provider, Document} from '../models';
import {AccountPayableRepository} from './account-payable.repository';
import {ProviderRepository} from './provider.repository';
import {DocumentRepository} from './document.repository';

export class AccountPayableHistoryRepository extends DefaultCrudRepository<
  AccountPayableHistory,
  typeof AccountPayableHistory.prototype.id,
  AccountPayableHistoryRelations
> {

  public readonly accountPayable: BelongsToAccessor<AccountPayable, typeof AccountPayableHistory.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof AccountPayableHistory.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof AccountPayableHistory.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('AccountPayableRepository') protected accountPayableRepositoryGetter: Getter<AccountPayableRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(AccountPayableHistory, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.accountPayable = this.createBelongsToAccessorFor('accountPayable', accountPayableRepositoryGetter,);
    this.registerInclusionResolver('accountPayable', this.accountPayable.inclusionResolver);
  }
}
