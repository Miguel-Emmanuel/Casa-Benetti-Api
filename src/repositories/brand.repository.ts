import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyThroughRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Brand, BrandRelations, Organization, Provider, ProviderBrand} from '../models';
import {OperationHook} from '../operation-hooks';
import {OrganizationRepository} from './organization.repository';
import {ProviderBrandRepository} from './provider-brand.repository';
import {ProviderRepository} from './provider.repository';

export class BrandRepository extends DefaultCrudRepository<
  Brand,
  typeof Brand.prototype.id,
  BrandRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Brand.prototype.id>;

  public readonly providers: HasManyThroughRepositoryFactory<Provider, typeof Provider.prototype.id,
    ProviderBrand,
    typeof Brand.prototype.id
  >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('ProviderBrandRepository') protected providerBrandRepositoryGetter: Getter<ProviderBrandRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(Brand, dataSource);
    this.providers = this.createHasManyThroughRepositoryFactoryFor('providers', providerRepositoryGetter, providerBrandRepositoryGetter,);
    this.registerInclusionResolver('providers', this.providers.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
    this.definePersistedModel(Brand)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.BRAND);
    });
  }
}
