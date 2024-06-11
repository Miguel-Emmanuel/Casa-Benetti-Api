import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Module, ModuleRelations, RoleModule} from '../models';
import {RoleModuleRepository} from './role-module.repository';

export class ModuleRepository extends DefaultCrudRepository<
  Module,
  typeof Module.prototype.id,
  ModuleRelations
> {

  public readonly roleModules: HasManyRepositoryFactory<RoleModule, typeof Module.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('RoleModuleRepository') protected roleModuleRepositoryGetter: Getter<RoleModuleRepository>,
  ) {
    super(Module, dataSource);
    this.roleModules = this.createHasManyRepositoryFactoryFor('roleModules', roleModuleRepositoryGetter,);
    this.registerInclusionResolver('roleModules', this.roleModules.inclusionResolver);
  }
}
