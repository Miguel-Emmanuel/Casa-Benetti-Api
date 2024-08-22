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
  Branch,
} from '../models';
import {InventoryMovementsRepository} from '../repositories';

export class InventoryMovementsBranchController {
  constructor(
    @repository(InventoryMovementsRepository)
    public inventoryMovementsRepository: InventoryMovementsRepository,
  ) { }

  @get('/inventory-movements/{id}/branch', {
    responses: {
      '200': {
        description: 'Branch belonging to InventoryMovements',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Branch),
          },
        },
      },
    },
  })
  async getBranch(
    @param.path.number('id') id: typeof InventoryMovements.prototype.id,
  ): Promise<Branch> {
    return this.inventoryMovementsRepository.destinationBranch(id);
  }
}
