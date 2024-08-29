import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {QuotationProductsStock, QuotationProductsStockRelations} from '../models';

export class QuotationProductsStockRepository extends DefaultCrudRepository<
  QuotationProductsStock,
  typeof QuotationProductsStock.prototype.id,
  QuotationProductsStockRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(QuotationProductsStock, dataSource);
  }
}
