import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  InventoryMovements,
  Warehouse,
} from '../models';
import {InventoryMovementsRepository} from '../repositories';

export class InventoryMovementsWarehouseController {
  constructor(
    @repository(InventoryMovementsRepository)
    public inventoryMovementsRepository: InventoryMovementsRepository,
  ) { }

  @get('/inventory-movements/{id}/warehouse', {
    responses: {
      '200': {
        description: 'Warehouse belonging to InventoryMovements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Warehouse),
          },
        },
      },
    },
  })
  async getWarehouse(
    @param.path.number('id') id: typeof InventoryMovements.prototype.id,
  ): Promise<Warehouse> {
    return this.inventoryMovementsRepository.destinationWarehouse(id);
  }
}
