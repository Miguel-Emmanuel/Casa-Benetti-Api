import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProviderBrand, ProviderBrandRelations, Brand, Provider} from '../models';
import {BrandRepository} from './brand.repository';
import {ProviderRepository} from './provider.repository';

export class ProviderBrandRepository extends DefaultCrudRepository<
  ProviderBrand,
  typeof ProviderBrand.prototype.id,
  ProviderBrandRelations
> {

  public readonly brand: BelongsToAccessor<Brand, typeof ProviderBrand.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof ProviderBrand.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('BrandRepository') protected brandRepositoryGetter: Getter<BrandRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(ProviderBrand, dataSource);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.brand = this.createBelongsToAccessorFor('brand', brandRepositoryGetter,);
    this.registerInclusionResolver('brand', this.brand.inclusionResolver);
  }
}
