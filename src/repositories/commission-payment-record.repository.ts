import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPaymentRecord, CommissionPaymentRecordRelations} from '../models';

export class CommissionPaymentRecordRepository extends DefaultCrudRepository<
  CommissionPaymentRecord,
  typeof CommissionPaymentRecord.prototype.id,
  CommissionPaymentRecordRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CommissionPaymentRecord, dataSource);
  }
}
