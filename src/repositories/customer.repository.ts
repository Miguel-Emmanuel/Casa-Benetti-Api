import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Customer, CustomerRelations, Organization, Group} from '../models';
import {OperationHook} from '../operation-hooks';
import {OrganizationRepository} from './organization.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {GroupRepository} from './group.repository';

export class CustomerRepository extends SoftCrudRepository<
  Customer,
  typeof Customer.prototype.id,
  CustomerRelations
> {


  public readonly organization: BelongsToAccessor<Organization, typeof Customer.prototype.id>;

  public readonly group: BelongsToAccessor<Group, typeof Customer.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('GroupRepository') protected groupRepositoryGetter: Getter<GroupRepository>,
  ) {
    super(Customer, dataSource);
    this.group = this.createBelongsToAccessorFor('group', groupRepositoryGetter,);
    this.registerInclusionResolver('group', this.group.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);

    this.definePersistedModel(Customer)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.CUSTOMER);
    });
  }
}
