import {authenticate} from '@loopback/authentication';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {AccountPayable} from '../models';
import {AccountPayableRepository} from '../repositories';

@authenticate('jwt')
export class AccountPayableController {
  constructor(
    @repository(AccountPayableRepository)
    public accountPayableRepository: AccountPayableRepository,
  ) { }

  @post('/account-payables')
  @response(200, {
    description: 'AccountPayable model instance',
    content: {'application/json': {schema: getModelSchemaRef(AccountPayable)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountPayable, {
            title: 'NewAccountPayable',
            exclude: ['id'],
          }),
        },
      },
    })
    accountPayable: Omit<AccountPayable, 'id'>,
  ): Promise<AccountPayable> {
    return this.accountPayableRepository.create(accountPayable);
  }

  @get('/account-payables/count')
  @response(200, {
    description: 'AccountPayable model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(AccountPayable) where?: Where<AccountPayable>,
  ): Promise<Count> {
    return this.accountPayableRepository.count(where);
  }

  @get('/account-payables')
  @response(200, {
    description: 'Array of AccountPayable model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountPayable, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(AccountPayable) filter?: Filter<AccountPayable>,
  ): Promise<AccountPayable[]> {
    return this.accountPayableRepository.find(filter);
  }

  @patch('/account-payables')
  @response(200, {
    description: 'AccountPayable PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountPayable, {partial: true}),
        },
      },
    })
    accountPayable: AccountPayable,
    @param.where(AccountPayable) where?: Where<AccountPayable>,
  ): Promise<Count> {
    return this.accountPayableRepository.updateAll(accountPayable, where);
  }

  @get('/account-payables/{id}')
  @response(200, {
    description: 'AccountPayable model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(AccountPayable, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AccountPayable, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountPayable>
  ): Promise<AccountPayable> {
    return this.accountPayableRepository.findById(id, filter);
  }

  @patch('/account-payables/{id}')
  @response(204, {
    description: 'AccountPayable PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(AccountPayable, {partial: true}),
        },
      },
    })
    accountPayable: AccountPayable,
  ): Promise<void> {
    await this.accountPayableRepository.updateById(id, accountPayable);
  }

  @put('/account-payables/{id}')
  @response(204, {
    description: 'AccountPayable PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() accountPayable: AccountPayable,
  ): Promise<void> {
    await this.accountPayableRepository.replaceById(id, accountPayable);
  }

  @del('/account-payables/{id}')
  @response(204, {
    description: 'AccountPayable DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.accountPayableRepository.deleteById(id);
  }
}
