import {Getter, inject} from '@loopback/core';
import {HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Organization, OrganizationRelations, Role, User} from '../models';
import {OperationHook} from '../operation-hooks';
import {RoleRepository} from './role.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {UserRepository} from './user.repository';

export class OrganizationRepository extends SoftCrudRepository<
  Organization,
  typeof Organization.prototype.id,
  OrganizationRelations
> {

  public readonly users: HasManyRepositoryFactory<User, typeof Organization.prototype.id>;

  public readonly roles: HasManyRepositoryFactory<Role, typeof Organization.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>,
  ) {
    super(Organization, dataSource);
    this.definePersistedModel(Organization)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.ORGANIZATION);
    });
    this.roles = this.createHasManyRepositoryFactoryFor('roles', roleRepositoryGetter,);
    this.registerInclusionResolver('roles', this.roles.inclusionResolver);
    this.users = this.createHasManyRepositoryFactoryFor('users', userRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
  }
}
