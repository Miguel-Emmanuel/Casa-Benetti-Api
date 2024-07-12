import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {AccountPayable, AccountPayableHistory, AccountPayableHistoryRelations, Document, Provider} from '../models';
import {OperationHook} from '../operation-hooks';
import {AccountPayableRepository} from './account-payable.repository';
import {DocumentRepository} from './document.repository';
import {ProviderRepository} from './provider.repository';

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
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>
  ) {
    super(AccountPayableHistory, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.accountPayable = this.createBelongsToAccessorFor('accountPayable', accountPayableRepositoryGetter,);
    this.registerInclusionResolver('accountPayable', this.accountPayable.inclusionResolver);
    this.definePersistedModel(AccountPayableHistory)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.ACCOUNTPAYABLEHISTORY);
    });
  }
}
