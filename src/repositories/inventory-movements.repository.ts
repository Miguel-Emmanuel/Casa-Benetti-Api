import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InventoryMovements, InventoryMovementsRelations, Project, Inventories, Container, Collection} from '../models';
import {ProjectRepository} from './project.repository';
import {InventoriesRepository} from './inventories.repository';
import {ContainerRepository} from './container.repository';
import {CollectionRepository} from './collection.repository';

export class InventoryMovementsRepository extends DefaultCrudRepository<
  InventoryMovements,
  typeof InventoryMovements.prototype.id,
  InventoryMovementsRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof InventoryMovements.prototype.id>;

  public readonly inventories: BelongsToAccessor<Inventories, typeof InventoryMovements.prototype.id>;

  public readonly container: BelongsToAccessor<Container, typeof InventoryMovements.prototype.id>;

  public readonly collection: BelongsToAccessor<Collection, typeof InventoryMovements.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('InventoriesRepository') protected inventoriesRepositoryGetter: Getter<InventoriesRepository>, @repository.getter('ContainerRepository') protected containerRepositoryGetter: Getter<ContainerRepository>, @repository.getter('CollectionRepository') protected collectionRepositoryGetter: Getter<CollectionRepository>,
  ) {
    super(InventoryMovements, dataSource);
    this.collection = this.createBelongsToAccessorFor('collection', collectionRepositoryGetter,);
    this.registerInclusionResolver('collection', this.collection.inclusionResolver);
    this.container = this.createBelongsToAccessorFor('container', containerRepositoryGetter,);
    this.registerInclusionResolver('container', this.container.inclusionResolver);
    this.inventories = this.createBelongsToAccessorFor('inventories', inventoriesRepositoryGetter,);
    this.registerInclusionResolver('inventories', this.inventories.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
