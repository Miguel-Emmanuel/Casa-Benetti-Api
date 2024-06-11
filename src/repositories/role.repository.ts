import {Getter, inject} from '@loopback/core';
import {HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Role, RoleRelations, User} from '../models';
import {OperationHook} from '../operation-hooks';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {UserRepository} from './user.repository';

export class RoleRepository extends SoftCrudRepository<
  Role,
  typeof Role.prototype.id,
  RoleRelations
> {

  public readonly users: HasManyRepositoryFactory<User, typeof Role.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Role, dataSource);
    this.definePersistedModel(Role)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.ROLE);
    });
    this.users = this.createHasManyRepositoryFactoryFor('users', userRepositoryGetter,);
    this.registerInclusionResolver('users', this.users.inclusionResolver);
  }
}
