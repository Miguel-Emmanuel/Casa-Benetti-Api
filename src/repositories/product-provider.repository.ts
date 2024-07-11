import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductProvider, ProductProviderRelations, Product, Provider} from '../models';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';

export class ProductProviderRepository extends DefaultCrudRepository<
  ProductProvider,
  typeof ProductProvider.prototype.id,
  ProductProviderRelations
> {

  public readonly product: BelongsToAccessor<Product, typeof ProductProvider.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof ProductProvider.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(ProductProvider, dataSource);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
