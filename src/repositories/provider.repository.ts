import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Provider, ProviderRelations, Organization, Product} from '../models';
import {OperationHook} from '../operation-hooks';
import {OrganizationRepository} from './organization.repository';
import {ProductRepository} from './product.repository';

export class ProviderRepository extends DefaultCrudRepository<
  Provider,
  typeof Provider.prototype.id,
  ProviderRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Provider.prototype.id>;

  public readonly products: HasManyRepositoryFactory<Product, typeof Provider.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>,
  ) {
    super(Provider, dataSource);
    this.products = this.createHasManyRepositoryFactoryFor('products', productRepositoryGetter,);
    this.registerInclusionResolver('products', this.products.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
    this.definePersistedModel(Provider)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.PROVIDER);
    });
  }
}
