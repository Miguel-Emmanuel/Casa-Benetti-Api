import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProducts, QuotationProductsRelations, Product, Provider} from '../models';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';

export class QuotationProductsRepository extends DefaultCrudRepository<
  QuotationProducts,
  typeof QuotationProducts.prototype.id,
  QuotationProductsRelations
> {

  public readonly product: BelongsToAccessor<Product, typeof QuotationProducts.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof QuotationProducts.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(QuotationProducts, dataSource);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
