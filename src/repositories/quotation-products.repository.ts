import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProducts, QuotationProductsRelations} from '../models';

export class QuotationProductsRepository extends DefaultCrudRepository<
  QuotationProducts,
  typeof QuotationProducts.prototype.id,
  QuotationProductsRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(QuotationProducts, dataSource);
  }
}
