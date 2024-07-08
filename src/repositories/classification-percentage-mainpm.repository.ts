import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ClassificationPercentageMainpm, ClassificationPercentageMainpmRelations, Quotation, Classification} from '../models';
import {QuotationRepository} from './quotation.repository';
import {ClassificationRepository} from './classification.repository';

export class ClassificationPercentageMainpmRepository extends DefaultCrudRepository<
  ClassificationPercentageMainpm,
  typeof ClassificationPercentageMainpm.prototype.id,
  ClassificationPercentageMainpmRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof ClassificationPercentageMainpm.prototype.id>;

  public readonly classification: BelongsToAccessor<Classification, typeof ClassificationPercentageMainpm.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>,
  ) {
    super(ClassificationPercentageMainpm, dataSource);
    this.classification = this.createBelongsToAccessorFor('classification', classificationRepositoryGetter,);
    this.registerInclusionResolver('classification', this.classification.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
  }
}
