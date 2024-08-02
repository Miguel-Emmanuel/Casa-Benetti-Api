import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {DeliveryRequest, DeliveryRequestRelations, PurchaseOrders, Project, Customer, Document} from '../models';
import {PurchaseOrdersRepository} from './purchase-orders.repository';
import {ProjectRepository} from './project.repository';
import {CustomerRepository} from './customer.repository';
import {DocumentRepository} from './document.repository';

export class DeliveryRequestRepository extends DefaultCrudRepository<
  DeliveryRequest,
  typeof DeliveryRequest.prototype.id,
  DeliveryRequestRelations
> {

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof DeliveryRequest.prototype.id>;

  public readonly project: BelongsToAccessor<Project, typeof DeliveryRequest.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof DeliveryRequest.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof DeliveryRequest.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(DeliveryRequest, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
  }
}
