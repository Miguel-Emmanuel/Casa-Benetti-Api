import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ClassificationPercentageMainpm, QuotationProjectManager, QuotationProjectManagerRelations, User} from '../models';
import {ClassificationPercentageMainpmRepository} from './classification-percentage-mainpm.repository';
import {ClassificationRepository} from './classification.repository';
import {UserRepository} from './user.repository';

export class QuotationProjectManagerRepository extends DefaultCrudRepository<
  QuotationProjectManager,
  typeof QuotationProjectManager.prototype.id,
  QuotationProjectManagerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationProjectManager.prototype.id>;


  public readonly classificationPercentageMainpms: HasManyRepositoryFactory<ClassificationPercentageMainpm, typeof QuotationProjectManager.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>, @repository.getter('ClassificationPercentageMainpmRepository') protected classificationPercentageMainpmRepositoryGetter: Getter<ClassificationPercentageMainpmRepository>,
  ) {
    super(QuotationProjectManager, dataSource);
    this.classificationPercentageMainpms = this.createHasManyRepositoryFactoryFor('classificationPercentageMainpms', classificationPercentageMainpmRepositoryGetter,);
    this.registerInclusionResolver('classificationPercentageMainpms', this.classificationPercentageMainpms.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
