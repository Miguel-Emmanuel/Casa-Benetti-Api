import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyThroughRepositoryFactory, repository, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Brand, Organization, Provider, ProviderBrand, ProviderRelations, ProductProvider} from '../models';
import {OperationHook} from '../operation-hooks';
import {BrandRepository} from './brand.repository';
import {OrganizationRepository} from './organization.repository';
import {ProductRepository} from './product.repository';
import {ProviderBrandRepository} from './provider-brand.repository';
import {ProductProviderRepository} from './product-provider.repository';

export class ProviderRepository extends DefaultCrudRepository<
  Provider,
  typeof Provider.prototype.id,
  ProviderRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Provider.prototype.id>;


  // public readonly products: HasManyRepositoryFactory<Product, typeof Provider.prototype.id>;
  public readonly productProvider: HasOneRepositoryFactory<ProductProvider, typeof Provider.prototype.id>;
  public readonly brands: HasManyThroughRepositoryFactory<Brand, typeof Brand.prototype.id,
    ProviderBrand,
    typeof Provider.prototype.id
  >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('ProviderBrandRepository') protected providerBrandRepositoryGetter: Getter<ProviderBrandRepository>, @repository.getter('BrandRepository') protected brandRepositoryGetter: Getter<BrandRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProductProviderRepository') protected productProviderRepositoryGetter: Getter<ProductProviderRepository>,
  ) {
    super(Provider, dataSource);
    this.productProvider = this.createHasOneRepositoryFactoryFor('productProvider', productProviderRepositoryGetter);
    this.registerInclusionResolver('productProvider', this.productProvider.inclusionResolver);
    // this.products = this.createHasManyRepositoryFactoryFor('products', productRepositoryGetter,);
    // this.registerInclusionResolver('products', this.products.inclusionResolver);
    this.brands = this.createHasManyThroughRepositoryFactoryFor('brands', brandRepositoryGetter, providerBrandRepositoryGetter,);
    this.registerInclusionResolver('brands', this.brands.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
    this.definePersistedModel(Provider)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.PROVIDER);
    });
  }
}
