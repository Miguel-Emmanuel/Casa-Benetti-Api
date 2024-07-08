import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProjectManager, QuotationProjectManagerRelations, User, Classification, ClassificationPercentageMainpm} from '../models';
import {UserRepository} from './user.repository';
import {ClassificationRepository} from './classification.repository';
import {ClassificationPercentageMainpmRepository} from './classification-percentage-mainpm.repository';

export class QuotationProjectManagerRepository extends DefaultCrudRepository<
  QuotationProjectManager,
  typeof QuotationProjectManager.prototype.id,
  QuotationProjectManagerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationProjectManager.prototype.id>;

  public readonly classification: BelongsToAccessor<Classification, typeof QuotationProjectManager.prototype.id>;

  public readonly classificationPercentageMainpms: HasManyRepositoryFactory<ClassificationPercentageMainpm, typeof QuotationProjectManager.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>, @repository.getter('ClassificationPercentageMainpmRepository') protected classificationPercentageMainpmRepositoryGetter: Getter<ClassificationPercentageMainpmRepository>,
  ) {
    super(QuotationProjectManager, dataSource);
    this.classificationPercentageMainpms = this.createHasManyRepositoryFactoryFor('classificationPercentageMainpms', classificationPercentageMainpmRepositoryGetter,);
    this.registerInclusionResolver('classificationPercentageMainpms', this.classificationPercentageMainpms.inclusionResolver);
    this.classification = this.createBelongsToAccessorFor('classification', classificationRepositoryGetter,);
    this.registerInclusionResolver('classification', this.classification.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
