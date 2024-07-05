import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProductProvider, ProductProviderRelations, Product} from '../models';
import {ProductRepository} from './product.repository';

export class ProductProviderRepository extends DefaultCrudRepository<
  ProductProvider,
  typeof ProductProvider.prototype.id,
  ProductProviderRelations
> {

  public readonly product: BelongsToAccessor<Product, typeof ProductProvider.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>,
  ) {
    super(ProductProvider, dataSource);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
