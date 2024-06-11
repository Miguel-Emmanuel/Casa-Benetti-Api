import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {User, UserData, UserDataRelations} from '../models';
import {OperationHook} from '../operation-hooks';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {UserRepository} from './user.repository';

export class UserDataRepository extends SoftCrudRepository<
  UserData,
  typeof UserData.prototype.id,
  UserDataRelations
> {

  public readonly user: BelongsToAccessor<User, typeof UserData.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(UserData, dataSource);
    this.definePersistedModel(UserData)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.USER_DATA);
    });
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
