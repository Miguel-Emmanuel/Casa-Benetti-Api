import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InventoryMovements, InventoryMovementsRelations, Project, Inventories, Container, Collection, User, Branch, Warehouse} from '../models';
import {ProjectRepository} from './project.repository';
import {InventoriesRepository} from './inventories.repository';
import {ContainerRepository} from './container.repository';
import {CollectionRepository} from './collection.repository';
import {UserRepository} from './user.repository';
import {BranchRepository} from './branch.repository';
import {WarehouseRepository} from './warehouse.repository';

export class InventoryMovementsRepository extends DefaultCrudRepository<
  InventoryMovements,
  typeof InventoryMovements.prototype.id,
  InventoryMovementsRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof InventoryMovements.prototype.id>;

  public readonly inventories: BelongsToAccessor<Inventories, typeof InventoryMovements.prototype.id>;

  public readonly container: BelongsToAccessor<Container, typeof InventoryMovements.prototype.id>;

  public readonly collection: BelongsToAccessor<Collection, typeof InventoryMovements.prototype.id>;

  public readonly createdBy: BelongsToAccessor<User, typeof InventoryMovements.prototype.id>;

  public readonly destinationBranch: BelongsToAccessor<Branch, typeof InventoryMovements.prototype.id>;

  public readonly destinationWarehouse: BelongsToAccessor<Warehouse, typeof InventoryMovements.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('InventoriesRepository') protected inventoriesRepositoryGetter: Getter<InventoriesRepository>, @repository.getter('ContainerRepository') protected containerRepositoryGetter: Getter<ContainerRepository>, @repository.getter('CollectionRepository') protected collectionRepositoryGetter: Getter<CollectionRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('WarehouseRepository') protected warehouseRepositoryGetter: Getter<WarehouseRepository>,
  ) {
    super(InventoryMovements, dataSource);
    this.destinationWarehouse = this.createBelongsToAccessorFor('destinationWarehouse', warehouseRepositoryGetter,);
    this.registerInclusionResolver('destinationWarehouse', this.destinationWarehouse.inclusionResolver);
    this.destinationBranch = this.createBelongsToAccessorFor('destinationBranch', branchRepositoryGetter,);
    this.registerInclusionResolver('destinationBranch', this.destinationBranch.inclusionResolver);
    this.createdBy = this.createBelongsToAccessorFor('createdBy', userRepositoryGetter,);
    this.registerInclusionResolver('createdBy', this.createdBy.inclusionResolver);
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
