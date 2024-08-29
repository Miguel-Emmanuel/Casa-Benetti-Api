import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProductsStock, QuotationProductsStockRelations, QuotationProducts, Quotation} from '../models';
import {QuotationProductsRepository} from './quotation-products.repository';
import {QuotationRepository} from './quotation.repository';

export class QuotationProductsStockRepository extends DefaultCrudRepository<
  QuotationProductsStock,
  typeof QuotationProductsStock.prototype.id,
  QuotationProductsStockRelations
> {

  public readonly quotationProducts: BelongsToAccessor<QuotationProducts, typeof QuotationProductsStock.prototype.id>;

  public readonly quotation: BelongsToAccessor<Quotation, typeof QuotationProductsStock.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>,
  ) {
    super(QuotationProductsStock, dataSource);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.quotationProducts = this.createBelongsToAccessorFor('quotationProducts', quotationProductsRepositoryGetter,);
    this.registerInclusionResolver('quotationProducts', this.quotationProducts.inclusionResolver);
  }
}
