import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Inventories, InventoriesRelations, QuotationProducts} from '../models';
import {QuotationProductsRepository} from './quotation-products.repository';

export class InventoriesRepository extends DefaultCrudRepository<
  Inventories,
  typeof Inventories.prototype.id,
  InventoriesRelations
> {

  public readonly quotationProducts: BelongsToAccessor<QuotationProducts, typeof Inventories.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>,
  ) {
    super(Inventories, dataSource);
    this.quotationProducts = this.createBelongsToAccessorFor('quotationProducts', quotationProductsRepositoryGetter,);
    this.registerInclusionResolver('quotationProducts', this.quotationProducts.inclusionResolver);
  }
}
