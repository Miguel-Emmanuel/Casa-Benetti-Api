import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  InternalExpenses,
  Brand,
} from '../models';
import {InternalExpensesRepository} from '../repositories';

export class InternalExpensesBrandController {
  constructor(
    @repository(InternalExpensesRepository)
    public internalExpensesRepository: InternalExpensesRepository,
  ) { }

  @get('/internal-expenses/{id}/brand', {
    responses: {
      '200': {
        description: 'Brand belonging to InternalExpenses',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Brand),
          },
        },
      },
    },
  })
  async getBrand(
    @param.path.number('id') id: typeof InternalExpenses.prototype.id,
  ): Promise<Brand> {
    return this.internalExpensesRepository.brand(id);
  }
}
