import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationDesigner, QuotationDesignerRelations} from '../models';

export class QuotationDesignerRepository extends DefaultCrudRepository<
  QuotationDesigner,
  typeof QuotationDesigner.prototype.id,
  QuotationDesignerRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(QuotationDesigner, dataSource);
  }
}
