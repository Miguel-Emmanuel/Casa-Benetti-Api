import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ProofPaymentQuotation, ProofPaymentQuotationRelations, Document} from '../models';
import {DocumentRepository} from './document.repository';

export class ProofPaymentQuotationRepository extends DefaultCrudRepository<
  ProofPaymentQuotation,
  typeof ProofPaymentQuotation.prototype.id,
  ProofPaymentQuotationRelations
> {

  public readonly documents: HasManyRepositoryFactory<Document, typeof ProofPaymentQuotation.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(ProofPaymentQuotation, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
  }
}
