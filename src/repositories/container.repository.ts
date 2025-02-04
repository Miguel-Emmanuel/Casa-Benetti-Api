import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Container, ContainerRelations, Document, Collection, PurchaseOrders} from '../models';
import {DocumentRepository} from './document.repository';
import {CollectionRepository} from './collection.repository';
import {PurchaseOrdersRepository} from './purchase-orders.repository';

export class ContainerRepository extends DefaultCrudRepository<
  Container,
  typeof Container.prototype.id,
  ContainerRelations
> {

  public readonly documents: HasManyRepositoryFactory<Document, typeof Container.prototype.id>;

  public readonly collection: HasOneRepositoryFactory<Collection, typeof Container.prototype.id>;

  public readonly purchaseOrders: HasManyRepositoryFactory<PurchaseOrders, typeof Container.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('CollectionRepository') protected collectionRepositoryGetter: Getter<CollectionRepository>, @repository.getter('PurchaseOrdersRepository') protected purchaseOrdersRepositoryGetter: Getter<PurchaseOrdersRepository>,
  ) {
    super(Container, dataSource);
    this.purchaseOrders = this.createHasManyRepositoryFactoryFor('purchaseOrders', purchaseOrdersRepositoryGetter,);
    this.registerInclusionResolver('purchaseOrders', this.purchaseOrders.inclusionResolver);
    this.collection = this.createHasOneRepositoryFactoryFor('collection', collectionRepositoryGetter);
    this.registerInclusionResolver('collection', this.collection.inclusionResolver);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
  }
}
