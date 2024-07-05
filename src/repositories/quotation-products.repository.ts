import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProducts, QuotationProductsRelations, Product, Provider, Document} from '../models';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';
import {DocumentRepository} from './document.repository';

export class QuotationProductsRepository extends DefaultCrudRepository<
  QuotationProducts,
  typeof QuotationProducts.prototype.id,
  QuotationProductsRelations
> {

  public readonly product: BelongsToAccessor<Product, typeof QuotationProducts.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof QuotationProducts.prototype.id>;

  public readonly mainMaterialImage: HasOneRepositoryFactory<Document, typeof QuotationProducts.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(QuotationProducts, dataSource);
    this.mainMaterialImage = this.createHasOneRepositoryFactoryFor('mainMaterialImage', documentRepositoryGetter);
    this.registerInclusionResolver('mainMaterialImage', this.mainMaterialImage.inclusionResolver);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
