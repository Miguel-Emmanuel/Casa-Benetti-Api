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
  User,
} from '../models';
import {InventoryMovementsRepository} from '../repositories';

export class InventoryMovementsUserController {
  constructor(
    @repository(InventoryMovementsRepository)
    public inventoryMovementsRepository: InventoryMovementsRepository,
  ) { }

  @get('/inventory-movements/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to InventoryMovements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof InventoryMovements.prototype.id,
  ): Promise<User> {
    return this.inventoryMovementsRepository.createdBy(id);
  }
}
