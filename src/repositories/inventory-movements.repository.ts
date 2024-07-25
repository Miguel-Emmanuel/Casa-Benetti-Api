import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InventoryMovements, InventoryMovementsRelations} from '../models';

export class InventoryMovementsRepository extends DefaultCrudRepository<
  InventoryMovements,
  typeof InventoryMovements.prototype.id,
  InventoryMovementsRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(InventoryMovements, dataSource);
  }
}
