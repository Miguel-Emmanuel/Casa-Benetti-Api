import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPayment, CommissionPaymentRelations, CommissionPaymentRecord} from '../models';
import {CommissionPaymentRecordRepository} from './commission-payment-record.repository';

export class CommissionPaymentRepository extends DefaultCrudRepository<
  CommissionPayment,
  typeof CommissionPayment.prototype.id,
  CommissionPaymentRelations
> {

  public readonly commissionPaymentRecord: BelongsToAccessor<CommissionPaymentRecord, typeof CommissionPayment.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CommissionPaymentRecordRepository') protected commissionPaymentRecordRepositoryGetter: Getter<CommissionPaymentRecordRepository>,
  ) {
    super(CommissionPayment, dataSource);
    this.commissionPaymentRecord = this.createBelongsToAccessorFor('commissionPaymentRecord', commissionPaymentRecordRepositoryGetter,);
    this.registerInclusionResolver('commissionPaymentRecord', this.commissionPaymentRecord.inclusionResolver);
  }
}
