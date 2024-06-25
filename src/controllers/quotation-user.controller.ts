import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  Quotation,
  User,
} from '../models';
import {QuotationRepository} from '../repositories';

export class QuotationUserController {
  constructor(
    @repository(QuotationRepository)
    public quotationRepository: QuotationRepository,
  ) { }

  @get('/quotations/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to Quotation',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User),
          },
        },
      },
    },
  })
  async getUser(
    @param.path.number('id') id: typeof Quotation.prototype.id,
  ): Promise<User> {
    return this.quotationRepository.showroomManager(id);
  }
}
