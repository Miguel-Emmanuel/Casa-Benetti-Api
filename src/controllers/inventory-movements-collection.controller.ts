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
  Collection,
} from '../models';
import {InventoryMovementsRepository} from '../repositories';

export class InventoryMovementsCollectionController {
  constructor(
    @repository(InventoryMovementsRepository)
    public inventoryMovementsRepository: InventoryMovementsRepository,
  ) { }

  @get('/inventory-movements/{id}/collection', {
    responses: {
      '200': {
        description: 'Collection belonging to InventoryMovements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Collection),
          },
        },
      },
    },
  })
  async getCollection(
    @param.path.number('id') id: typeof InventoryMovements.prototype.id,
  ): Promise<Collection> {
    return this.inventoryMovementsRepository.collection(id);
  }
}
