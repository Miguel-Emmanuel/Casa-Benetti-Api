import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProjectManager, QuotationProjectManagerRelations, User, Classification} from '../models';
import {UserRepository} from './user.repository';
import {ClassificationRepository} from './classification.repository';

export class QuotationProjectManagerRepository extends DefaultCrudRepository<
  QuotationProjectManager,
  typeof QuotationProjectManager.prototype.id,
  QuotationProjectManagerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationProjectManager.prototype.id>;

  public readonly classification: BelongsToAccessor<Classification, typeof QuotationProjectManager.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>,
  ) {
    super(QuotationProjectManager, dataSource);
    this.classification = this.createBelongsToAccessorFor('classification', classificationRepositoryGetter,);
    this.registerInclusionResolver('classification', this.classification.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
