import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountsReceivable, AccountsReceivableRelations, Project, Customer} from '../models';
import {ProjectRepository} from './project.repository';
import {CustomerRepository} from './customer.repository';

export class AccountsReceivableRepository extends DefaultCrudRepository<
  AccountsReceivable,
  typeof AccountsReceivable.prototype.id,
  AccountsReceivableRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AccountsReceivable.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof AccountsReceivable.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(AccountsReceivable, dataSource);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
