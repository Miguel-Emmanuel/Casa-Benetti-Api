import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationDesigner, QuotationDesignerRelations, User, ClassificationPercentageMainpm} from '../models';
import {UserRepository} from './user.repository';
import {ClassificationPercentageMainpmRepository} from './classification-percentage-mainpm.repository';

export class QuotationDesignerRepository extends DefaultCrudRepository<
  QuotationDesigner,
  typeof QuotationDesigner.prototype.id,
  QuotationDesignerRelations
> {

  public readonly user: BelongsToAccessor<User, typeof QuotationDesigner.prototype.id>;

  public readonly classificationPercentageMainpms: HasManyRepositoryFactory<ClassificationPercentageMainpm, typeof QuotationDesigner.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ClassificationPercentageMainpmRepository') protected classificationPercentageMainpmRepositoryGetter: Getter<ClassificationPercentageMainpmRepository>,
  ) {
    super(QuotationDesigner, dataSource);
    this.classificationPercentageMainpms = this.createHasManyRepositoryFactoryFor('classificationPercentageMainpms', classificationPercentageMainpmRepositoryGetter,);
    this.registerInclusionResolver('classificationPercentageMainpms', this.classificationPercentageMainpms.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
