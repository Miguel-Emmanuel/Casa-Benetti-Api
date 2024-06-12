import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProjectManager, QuotationProjectManagerRelations} from '../models';

export class QuotationProjectManagerRepository extends DefaultCrudRepository<
  QuotationProjectManager,
  typeof QuotationProjectManager.prototype.id,
  QuotationProjectManagerRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(QuotationProjectManager, dataSource);
  }
}
