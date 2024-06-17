import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProjectManager, QuotationProjectManagerRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class QuotationProjectManagerRepository extends DefaultCrudRepository<
  QuotationProjectManager,
  typeof QuotationProjectManager.prototype.id,
  QuotationProjectManagerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationProjectManager.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(QuotationProjectManager, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
