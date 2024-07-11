import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayable, Proforma, PurchaseOrders, PurchaseOrdersRelations} from '../models';
import {AccountPayableRepository} from './account-payable.repository';
import {ProformaRepository} from './proforma.repository';
import {ProviderRepository} from './provider.repository';

export class PurchaseOrdersRepository extends DefaultCrudRepository<
  PurchaseOrders,
  typeof PurchaseOrders.prototype.id,
  PurchaseOrdersRelations
> {

  public readonly accountPayable: BelongsToAccessor<AccountPayable, typeof PurchaseOrders.prototype.id>;

  public readonly proforma: BelongsToAccessor<Proforma, typeof PurchaseOrders.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>, @repository.getter('AccountPayableRepository') protected accountPayableRepositoryGetter: Getter<AccountPayableRepository>, @repository.getter('ProformaRepository') protected proformaRepositoryGetter: Getter<ProformaRepository>,
  ) {
    super(PurchaseOrders, dataSource);
    this.proforma = this.createBelongsToAccessorFor('proforma', proformaRepositoryGetter,);
    this.registerInclusionResolver('proforma', this.proforma.inclusionResolver);
    this.accountPayable = this.createBelongsToAccessorFor('accountPayable', accountPayableRepositoryGetter,);
    this.registerInclusionResolver('accountPayable', this.accountPayable.inclusionResolver);
  }
}
