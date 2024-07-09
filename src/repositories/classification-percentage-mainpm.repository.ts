import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ClassificationPercentageMainpm, ClassificationPercentageMainpmRelations, Quotation, Classification, QuotationProjectManager} from '../models';
import {QuotationRepository} from './quotation.repository';
import {ClassificationRepository} from './classification.repository';
import {QuotationProjectManagerRepository} from './quotation-project-manager.repository';

export class ClassificationPercentageMainpmRepository extends DefaultCrudRepository<
  ClassificationPercentageMainpm,
  typeof ClassificationPercentageMainpm.prototype.id,
  ClassificationPercentageMainpmRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof ClassificationPercentageMainpm.prototype.id>;

  public readonly classification: BelongsToAccessor<Classification, typeof ClassificationPercentageMainpm.prototype.id>;

  public readonly quotationProjectManager: BelongsToAccessor<QuotationProjectManager, typeof ClassificationPercentageMainpm.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>, @repository.getter('QuotationProjectManagerRepository') protected quotationProjectManagerRepositoryGetter: Getter<QuotationProjectManagerRepository>,
  ) {
    super(ClassificationPercentageMainpm, dataSource);
    this.quotationProjectManager = this.createBelongsToAccessorFor('quotationProjectManager', quotationProjectManagerRepositoryGetter,);
    this.registerInclusionResolver('quotationProjectManager', this.quotationProjectManager.inclusionResolver);
    this.classification = this.createBelongsToAccessorFor('classification', classificationRepositoryGetter,);
    this.registerInclusionResolver('classification', this.classification.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
  }
}
