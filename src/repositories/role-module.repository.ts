import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Module, Role, RoleModule, RoleModuleRelations} from '../models';
import {ModuleRepository} from './module.repository';
import {RoleRepository} from './role.repository';

export class RoleModuleRepository extends DefaultCrudRepository<
  RoleModule,
  typeof RoleModule.prototype.id,
  RoleModuleRelations
> {

  public readonly role: BelongsToAccessor<Role, typeof RoleModule.prototype.id>;

  public readonly module: BelongsToAccessor<Module, typeof RoleModule.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>,
    @repository.getter('ModuleRepository') protected moduleRepositoryGetter: Getter<ModuleRepository>,
  ) {
    super(RoleModule, dataSource);
    this.module = this.createBelongsToAccessorFor('module', moduleRepositoryGetter,);
    this.registerInclusionResolver('module', this.module.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
  }
}
