import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InventoryMovements, InventoryMovementsRelations, Project, Inventories} from '../models';
import {ProjectRepository} from './project.repository';
import {InventoriesRepository} from './inventories.repository';

export class InventoryMovementsRepository extends DefaultCrudRepository<
  InventoryMovements,
  typeof InventoryMovements.prototype.id,
  InventoryMovementsRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof InventoryMovements.prototype.id>;

  public readonly inventories: BelongsToAccessor<Inventories, typeof InventoryMovements.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('InventoriesRepository') protected inventoriesRepositoryGetter: Getter<InventoriesRepository>,
  ) {
    super(InventoryMovements, dataSource);
    this.inventories = this.createBelongsToAccessorFor('inventories', inventoriesRepositoryGetter,);
    this.registerInclusionResolver('inventories', this.inventories.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
