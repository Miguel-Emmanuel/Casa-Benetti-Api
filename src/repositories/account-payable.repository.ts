import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountPayable, AccountPayableRelations, Customer, Project, PurchaseOrders, Quotation} from '../models';
import {CustomerRepository} from './customer.repository';
import {ProjectRepository} from './project.repository';
import {ProviderRepository} from './provider.repository';
import {PurchaseOrdersRepository} from './purchase-orders.repository';
import {QuotationRepository} from './quotation.repository';

export class AccountPayableRepository extends DefaultCrudRepository<
  AccountPayable,
  typeof AccountPayable.prototype.id,
  AccountPayableRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AccountPayable.prototype.id>;

  public readonly quotation: BelongsToAccessor<Quotation, typeof AccountPayable.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof AccountPayable.prototype.id>;

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof AccountPayable.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>,
  ) {
    super(AccountPayable, dataSource);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
