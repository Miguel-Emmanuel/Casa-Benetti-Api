import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Collection, CollectionRelations, PurchaseOrders} from '../models';
import {PurchaseOrdersRepository} from './purchase-orders.repository';

export class CollectionRepository extends DefaultCrudRepository<
  Collection,
  typeof Collection.prototype.id,
  CollectionRelations
> {

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof Collection.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>,
  ) {
    super(Collection, dataSource);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
  }
}
