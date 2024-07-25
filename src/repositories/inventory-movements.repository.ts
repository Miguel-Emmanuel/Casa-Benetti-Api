import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InventoryMovements, InventoryMovementsRelations, Project} from '../models';
import {ProjectRepository} from './project.repository';

export class InventoryMovementsRepository extends DefaultCrudRepository<
  InventoryMovements,
  typeof InventoryMovements.prototype.id,
  InventoryMovementsRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof InventoryMovements.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(InventoryMovements, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
