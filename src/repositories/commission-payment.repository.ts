import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPayment, CommissionPaymentRelations} from '../models';

export class CommissionPaymentRepository extends DefaultCrudRepository<
  CommissionPayment,
  typeof CommissionPayment.prototype.id,
  CommissionPaymentRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CommissionPayment, dataSource);
  }
}
