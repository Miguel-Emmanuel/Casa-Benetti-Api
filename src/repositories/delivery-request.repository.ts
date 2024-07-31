import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {DeliveryRequest, DeliveryRequestRelations, PurchaseOrders, Project} from '../models';
import {PurchaseOrdersRepository} from './purchase-orders.repository';
import {ProjectRepository} from './project.repository';

export class DeliveryRequestRepository extends DefaultCrudRepository<
  DeliveryRequest,
  typeof DeliveryRequest.prototype.id,
  DeliveryRequestRelations
> {

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof DeliveryRequest.prototype.id>;

  public readonly project: BelongsToAccessor<Project, typeof DeliveryRequest.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(DeliveryRequest, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
  }
}
