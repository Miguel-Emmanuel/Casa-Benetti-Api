import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyRepositoryFactory, repository, BelongsToAccessor, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {AccountPayable, AccountPayableHistory, AccountPayableRelations, Proforma, PurchaseOrders} from '../models';
import {OperationHook} from '../operation-hooks';
import {AccountPayableHistoryRepository} from './account-payable-history.repository';
import {CustomerRepository} from './customer.repository';
import {ProjectRepository} from './project.repository';
import {ProviderRepository} from './provider.repository';
import {PurchaseOrdersRepository} from './purchase-orders.repository';
import {QuotationRepository} from './quotation.repository';
import {ProformaRepository} from './proforma.repository';

export class AccountPayableRepository extends DefaultCrudRepository<
  AccountPayable,
  typeof AccountPayable.prototype.id,
  AccountPayableRelations
> {

  public readonly accountPayableHistories: HasManyRepositoryFactory<AccountPayableHistory, typeof AccountPayable.prototype.id>;

  public readonly proforma: BelongsToAccessor<Proforma, typeof AccountPayable.prototype.id>;

  public readonly purchaseOrders: HasOneRepositoryFactory<PurchaseOrders, typeof AccountPayable.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>,
    @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>,
    @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
    @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
    @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>, @repository.getter('AccountPayableHistoryRepository') protected accountPayableHistoryRepositoryGetter: Getter<AccountPayableHistoryRepository>, @repository.getter('ProformaRepository') protected proformaRepositoryGetter: Getter<ProformaRepository>,
  ) {
    super(AccountPayable, dataSource);
    this.purchaseOrders = this.createHasOneRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
    this.proforma = this.createBelongsToAccessorFor('proforma', proformaRepositoryGetter,);
    this.registerInclusionResolver('proforma', this.proforma.inclusionResolver);
    this.accountPayableHistories = this.createHasManyRepositoryFactoryFor('accountPayableHistories', accountPayableHistoryRepositoryGetter,);
    this.registerInclusionResolver('accountPayableHistories', this.accountPayableHistories.inclusionResolver);
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.ACCOUNTPAYABLE);
    });

  }
}
