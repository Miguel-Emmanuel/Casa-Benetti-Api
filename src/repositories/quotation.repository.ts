import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Quotation, QuotationRelations, User, QuotationProjectManager, QuotationDesigner, Product, QuotationProducts, Customer} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, HasManyThroughRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {QuotationProjectManagerRepository} from './quotation-project-manager.repository';
import {UserRepository} from './user.repository';
import {QuotationDesignerRepository} from './quotation-designer.repository';
import {QuotationProductsRepository} from './quotation-products.repository';
import {ProductRepository} from './product.repository';
import {CustomerRepository} from './customer.repository';

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

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProjectManagerRepository') protected quotationProjectManagerRepositoryGetter: Getter<QuotationProjectManagerRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('QuotationDesignerRepository') protected quotationDesignerRepositoryGetter: Getter<QuotationDesignerRepository>, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(Quotation, dataSource);
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
