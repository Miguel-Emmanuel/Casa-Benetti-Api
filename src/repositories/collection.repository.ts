import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Collection, CollectionRelations, PurchaseOrders, Document, Container} from '../models';
import {PurchaseOrdersRepository} from './purchase-orders.repository';
import {DocumentRepository} from './document.repository';
import {ContainerRepository} from './container.repository';

export class CollectionRepository extends DefaultCrudRepository<
  Collection,
  typeof Collection.prototype.id,
  CollectionRelations
> {

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof Collection.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof Collection.prototype.id>;

  public readonly container: BelongsToAccessor<Container, typeof Collection.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('ContainerRepository') protected containerRepositoryGetter: Getter<ContainerRepository>,
  ) {
    super(Collection, dataSource);
    this.container = this.createBelongsToAccessorFor('container', containerRepositoryGetter,);
    this.registerInclusionResolver('container', this.container.inclusionResolver);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
  }
}
