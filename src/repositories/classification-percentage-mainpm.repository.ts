import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ClassificationPercentageMainpm, ClassificationPercentageMainpmRelations, Quotation} from '../models';
import {QuotationRepository} from './quotation.repository';

export class ClassificationPercentageMainpmRepository extends DefaultCrudRepository<
  ClassificationPercentageMainpm,
  typeof ClassificationPercentageMainpm.prototype.id,
  ClassificationPercentageMainpmRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof ClassificationPercentageMainpm.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>,
  ) {
    super(ClassificationPercentageMainpm, dataSource);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
  }
}
