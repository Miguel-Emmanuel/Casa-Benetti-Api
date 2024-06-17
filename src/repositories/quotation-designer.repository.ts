import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationDesigner, QuotationDesignerRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class QuotationDesignerRepository extends DefaultCrudRepository<
  QuotationDesigner,
  typeof QuotationDesigner.prototype.id,
  QuotationDesignerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationDesigner.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(QuotationDesigner, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
