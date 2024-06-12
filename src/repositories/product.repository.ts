import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Document, Organization, Product, ProductRelations} from '../models';
import {OperationHook} from '../operation-hooks';
import {DocumentRepository} from './document.repository';
import {OrganizationRepository} from './organization.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class ProductRepository extends SoftCrudRepository<
  Product,
  typeof Product.prototype.id,
  ProductRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Product.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof Product.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(Product, dataSource);
    this.definePersistedModel(Product)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.PRODUCT);
    });
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
  }
}
