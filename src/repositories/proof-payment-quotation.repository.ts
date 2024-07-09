import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Document, ProofPaymentQuotation, ProofPaymentQuotationRelations, Quotation} from '../models';
import {DocumentRepository} from './document.repository';
import {ProductRepository} from './product.repository';
import {ProviderRepository} from './provider.repository';
import {QuotationRepository} from './quotation.repository';

export class ProofPaymentQuotationRepository extends DefaultCrudRepository<
  ProofPaymentQuotation,
  typeof ProofPaymentQuotation.prototype.id,
  ProofPaymentQuotationRelations
> {

  public readonly documents: HasManyRepositoryFactory<Document, typeof ProofPaymentQuotation.prototype.id>;

  public readonly quotation: BelongsToAccessor<Quotation, typeof ProofPaymentQuotation.prototype.id>;


  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('ProductRepository') protected productRepositoryGetter: Getter<ProductRepository>, @repository.getter('ProviderRepository') protected providerRepositoryGetter: Getter<ProviderRepository>,
  ) {
    super(ProofPaymentQuotation, dataSource);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
  }
}
