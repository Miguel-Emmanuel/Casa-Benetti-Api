import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProofPaymentQuotation, ProofPaymentQuotationRelations, Document, Quotation, Product, Provider} from '../models';
import {DocumentRepository} from './document.repository';
import {QuotationRepository} from './quotation.repository';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';

export class ProofPaymentQuotationRepository extends DefaultCrudRepository<
  ProofPaymentQuotation,
  typeof ProofPaymentQuotation.prototype.id,
  ProofPaymentQuotationRelations
> {

  public readonly documents: HasManyRepositoryFactory<Document, typeof ProofPaymentQuotation.prototype.id>;

  public readonly quotation: BelongsToAccessor<Quotation, typeof ProofPaymentQuotation.prototype.id>;

  public readonly product: BelongsToAccessor<Product, typeof ProofPaymentQuotation.prototype.id>;

  public readonly provider: BelongsToAccessor<Provider, typeof ProofPaymentQuotation.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(ProofPaymentQuotation, dataSource);
    this.provider = this.createBelongsToAccessorFor('provider', providerRepositoryGetter,);
    this.registerInclusionResolver('provider', this.provider.inclusionResolver);
    this.product = this.createBelongsToAccessorFor('product', productRepositoryGetter,);
    this.registerInclusionResolver('product', this.product.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
  }
}
