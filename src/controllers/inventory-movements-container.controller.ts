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
  Container,
} from '../models';
import {InventoryMovementsRepository} from '../repositories';

export class InventoryMovementsContainerController {
  constructor(
    @repository(InventoryMovementsRepository)
    public inventoryMovementsRepository: InventoryMovementsRepository,
  ) { }

  @get('/inventory-movements/{id}/container', {
    responses: {
      '200': {
        description: 'Container belonging to InventoryMovements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Container),
          },
        },
      },
    },
  })
  async getContainer(
    @param.path.number('id') id: typeof InventoryMovements.prototype.id,
  ): Promise<Container> {
    return this.inventoryMovementsRepository.container(id);
  }
}
