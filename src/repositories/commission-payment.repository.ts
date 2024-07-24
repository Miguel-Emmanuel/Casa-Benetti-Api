import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPayment, CommissionPaymentRelations, CommissionPaymentRecord, Document} from '../models';
import {CommissionPaymentRecordRepository} from './commission-payment-record.repository';
import {DocumentRepository} from './document.repository';

export class CommissionPaymentRepository extends DefaultCrudRepository<
  CommissionPayment,
  typeof CommissionPayment.prototype.id,
  CommissionPaymentRelations
> {

  public readonly commissionPaymentRecord: BelongsToAccessor<CommissionPaymentRecord, typeof CommissionPayment.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof CommissionPayment.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CommissionPaymentRecordRepository') protected commissionPaymentRecordRepositoryGetter: Getter<CommissionPaymentRecordRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(CommissionPayment, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.commissionPaymentRecord = this.createBelongsToAccessorFor('commissionPaymentRecord', commissionPaymentRecordRepositoryGetter,);
    this.registerInclusionResolver('commissionPaymentRecord', this.commissionPaymentRecord.inclusionResolver);
  }
}
