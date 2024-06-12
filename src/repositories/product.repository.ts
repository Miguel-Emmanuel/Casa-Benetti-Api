import {inject} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Product, ProductRelations} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class ProductRepository extends SoftCrudRepository<
  Product,
  typeof Product.prototype.id,
  ProductRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Product, dataSource);
  }
}
