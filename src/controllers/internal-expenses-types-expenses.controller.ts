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
  TypesExpenses,
} from '../models';
import {InternalExpensesRepository} from '../repositories';

export class InternalExpensesTypesExpensesController {
  constructor(
    @repository(InternalExpensesRepository)
    public internalExpensesRepository: InternalExpensesRepository,
  ) { }

  @get('/internal-expenses/{id}/types-expenses', {
    responses: {
      '200': {
        description: 'TypesExpenses belonging to InternalExpenses',
        content: {
          'application/json': {
            schema: getModelSchemaRef(TypesExpenses),
          },
        },
      },
    },
  })
  async getTypesExpenses(
    @param.path.number('id') id: typeof InternalExpenses.prototype.id,
  ): Promise<TypesExpenses> {
    return this.internalExpensesRepository.typesExpenses(id);
  }
}
