import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Container, ContainerRelations, Document, Collection} from '../models';
import {DocumentRepository} from './document.repository';
import {CollectionRepository} from './collection.repository';

export class ContainerRepository extends DefaultCrudRepository<
  Container,
  typeof Container.prototype.id,
  ContainerRelations
> {

  public readonly documents: HasManyRepositoryFactory<Document, typeof Container.prototype.id>;

  public readonly collection: HasOneRepositoryFactory<Collection, typeof Container.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('CollectionRepository') protected collectionRepositoryGetter: Getter<CollectionRepository>,
  ) {
    super(Container, dataSource);
    this.collection = this.createHasOneRepositoryFactoryFor('collection', collectionRepositoryGetter);
    this.registerInclusionResolver('collection', this.collection.inclusionResolver);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
  }
}
