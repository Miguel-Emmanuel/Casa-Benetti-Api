import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Document, Product, Provider, QuotationProducts, QuotationProductsRelations, Brand} from '../models';
import {DocumentRepository} from './document.repository';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';
import {BrandRepository} from './brand.repository';

export class QuotationProductsRepository extends DefaultCrudRepository<
  QuotationProducts,
  typeof QuotationProducts.prototype.id,
  QuotationProductsRelations
> {

  public readonly product: BelongsToAccessor<Product, typeof QuotationProducts.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof QuotationProducts.prototype.id>;

  public readonly mainMaterialImage: HasOneRepositoryFactory<Document, typeof QuotationProducts.prototype.id>;

  public readonly mainFinishImage: HasOneRepositoryFactory<Document, typeof QuotationProducts.prototype.id>;

  public readonly secondaryMaterialImage: HasOneRepositoryFactory<Document, typeof QuotationProducts.prototype.id>;

  public readonly secondaryFinishingImage: HasOneRepositoryFactory<Document, typeof QuotationProducts.prototype.id>;

  public readonly brand: BelongsToAccessor<Brand, typeof QuotationProducts.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('BrandRepository') protected brandRepositoryGetter: Getter<BrandRepository>,
  ) {
    super(QuotationProducts, dataSource);
    this.brand = this.createBelongsToAccessorFor('brand', brandRepositoryGetter,);
    this.registerInclusionResolver('brand', this.brand.inclusionResolver);
    this.secondaryFinishingImage = this.createHasOneRepositoryFactoryFor('secondaryFinishingImage', documentRepositoryGetter);
    this.registerInclusionResolver('secondaryFinishingImage', this.secondaryFinishingImage.inclusionResolver);
    this.secondaryMaterialImage = this.createHasOneRepositoryFactoryFor('secondaryMaterialImage', documentRepositoryGetter);
    this.registerInclusionResolver('secondaryMaterialImage', this.secondaryMaterialImage.inclusionResolver);
    this.mainFinishImage = this.createHasOneRepositoryFactoryFor('mainFinishImage', documentRepositoryGetter);
    this.registerInclusionResolver('mainFinishImage', this.mainFinishImage.inclusionResolver);
    this.mainMaterialImage = this.createHasOneRepositoryFactoryFor('mainMaterialImage', documentRepositoryGetter);
    this.registerInclusionResolver('mainMaterialImage', this.mainMaterialImage.inclusionResolver);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
  }
}
