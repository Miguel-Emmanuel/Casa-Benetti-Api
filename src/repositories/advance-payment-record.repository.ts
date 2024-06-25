import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AdvancePaymentRecord, AdvancePaymentRecordRelations} from '../models';

export class AdvancePaymentRecordRepository extends DefaultCrudRepository<
  AdvancePaymentRecord,
  typeof AdvancePaymentRecord.prototype.id,
  AdvancePaymentRecordRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(AdvancePaymentRecord, dataSource);
  }
}
