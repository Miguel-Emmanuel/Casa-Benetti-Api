import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, HasManyThroughRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Branch, Customer, Organization, Product, Quotation, QuotationDesigner, QuotationProducts, QuotationProjectManager, QuotationRelations, User} from '../models';
import {OperationHook} from '../operation-hooks';
import {BranchRepository} from './branch.repository';
import {CustomerRepository} from './customer.repository';
import {OrganizationRepository} from './organization.repository';
import {ProductRepository} from './product.repository';
import {QuotationDesignerRepository} from './quotation-designer.repository';
import {QuotationProductsRepository} from './quotation-products.repository';
import {QuotationProjectManagerRepository} from './quotation-project-manager.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {UserRepository} from './user.repository';

export class QuotationRepository extends SoftCrudRepository<
  Quotation,
  typeof Quotation.prototype.id,
  QuotationRelations
> {

  public readonly projectManagers: HasManyThroughRepositoryFactory<User, typeof User.prototype.id,
    QuotationProjectManager,
    typeof Quotation.prototype.id
  >;

  public readonly designers: HasManyThroughRepositoryFactory<User, typeof User.prototype.id,
    QuotationDesigner,
    typeof Quotation.prototype.id
  >;

  public readonly products: HasManyThroughRepositoryFactory<Product, typeof Product.prototype.id,
    QuotationProducts,
    typeof Quotation.prototype.id
  >;

  public readonly customer: BelongsToAccessor<Customer, typeof Quotation.prototype.id>;

  public readonly referenceCustomer: BelongsToAccessor<User, typeof Quotation.prototype.id>;

  public readonly organization: BelongsToAccessor<Organization, typeof Quotation.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Quotation.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('QuotationProjectManagerRepository') protected quotationProjectManagerRepositoryGetter: Getter<QuotationProjectManagerRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('QuotationDesignerRepository') protected quotationDesignerRepositoryGetter: Getter<QuotationDesignerRepository>, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>,
  ) {
    super(Quotation, dataSource);
    this.definePersistedModel(QuotationProducts)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.QUOTATION);
    });

    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
    this.referenceCustomer = this.createBelongsToAccessorFor('referenceCustomer', userRepositoryGetter,);
    this.registerInclusionResolver('referenceCustomer', this.referenceCustomer.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.products = this.createHasManyThroughRepositoryFactoryFor('products', productRepositoryGetter, quotationProductsRepositoryGetter,);
    this.registerInclusionResolver('products', this.products.inclusionResolver);
    this.designers = this.createHasManyThroughRepositoryFactoryFor('designers', userRepositoryGetter, quotationDesignerRepositoryGetter,);
    this.registerInclusionResolver('designers', this.designers.inclusionResolver);
    this.projectManagers = this.createHasManyThroughRepositoryFactoryFor('projectManagers', userRepositoryGetter, quotationProjectManagerRepositoryGetter,);
    this.registerInclusionResolver('projectManagers', this.projectManagers.inclusionResolver);
  }
}
