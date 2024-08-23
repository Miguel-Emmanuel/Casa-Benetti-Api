import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {DayExchangeRate, DayExchangeRateRelations} from '../models';

export class DayExchangeRateRepository extends DefaultCrudRepository<
  DayExchangeRate,
  typeof DayExchangeRate.prototype.id,
  DayExchangeRateRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(DayExchangeRate, dataSource);
  }
}
