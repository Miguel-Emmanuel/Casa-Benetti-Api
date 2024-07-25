import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Inventories, InventoriesRelations} from '../models';

export class InventoriesRepository extends DefaultCrudRepository<
  Inventories,
  typeof Inventories.prototype.id,
  InventoriesRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Inventories, dataSource);
  }
}
