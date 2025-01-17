import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {AccountPayable} from '../models';
import {AccountPayableRepository} from '../repositories';
import {AccountPayableService} from '../services';

@authenticate('jwt')
export class AccountPayableController {
  constructor(
    @repository(AccountPayableRepository)
    public accountPayableRepository: AccountPayableRepository,
    @service()
    public accountPayableService: AccountPayableService
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
  ): Promise<object> {
    return this.accountPayableService.create(accountPayable);
  }

  @get('/account-payables/count')
  @response(200, {
    description: 'AccountPayable model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(AccountPayable) where?: Where<AccountPayable>,
  ): Promise<object> {
    return this.accountPayableService.count(where);
  }

  @get('/account-payables')
  @response(200, {
    description: 'Array of AccountPayable model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountPayable, {includeRelations: false}),
        },
      },
    },
  })
  async find(
    @param.filter(AccountPayable) filter?: Filter<AccountPayable>,
  ): Promise<object> {
    return this.accountPayableService.find(filter);
  }

  @get('/account-payables/providers')
  @response(200, {
    description: 'Array of AccountPayable by providers model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountPayable, {includeRelations: false}),
        },
      },
    },
  })
  async findByProviders(
    @param.filter(AccountPayable) filter?: Filter<AccountPayable>,
  ): Promise<object> {
    return this.accountPayableService.findByProvider(filter);
  }

  @get('/account-payables/provider/{id}')
  @response(200, {
    description: 'AccountPayable by provider model instance',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountPayable, {includeRelations: false}),
        },
      },
    },
  })
  async findByIdProvider(
    @param.path.number('id') id: number,
    @param.query.number('providerId') providerId: number,
    @param.filter(AccountPayable, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountPayable>
  ): Promise<object> {
    return this.accountPayableService.findByIdProvider(id, filter, providerId);
  }

  @get('/account-payables/provider/{id}/projects')
  @response(200, {
    description: 'AccountPayable by provider model instance',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(AccountPayable, {includeRelations: false}),
        },
      },
    },
  })
  async findByIdProviderWithProjects(
    @param.path.number('id') id: number,
    @param.query.number('providerId') providerId: number,
    @param.filter(AccountPayable, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountPayable>
  ): Promise<object> {
    return this.accountPayableService.findProjectsByProvider(id, filter, providerId);
  }

  @get('/account-payables/{id}')
  @response(200, {
    description: 'AccountPayable model instance',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            idProject: {type: 'number'},
            clientName: {type: 'string'},
            closingDate: {type: 'string', format: 'date-time'},
            showroomManager: {type: 'string'},
            total: {type: 'number', nullable: true},
            purchaseOrders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'number'},
                  provider: {type: 'string'},
                  quantity: {type: 'number'},
                  total: {type: 'number'},
                  status: {type: 'string'},
                },
              },
            },
            accountPayableHistories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {type: 'number'},
                  proformaDate: {type: 'string', format: 'date-time'},
                  proformaNumber: {type: 'string'},
                  currency: {type: 'string'},
                  proformaAmount: {type: 'number'},
                  paymentDate: {type: 'string', format: 'date-time'},
                  advancePaymentAmount: {type: 'number'},
                  balance: {type: 'number'},
                  status: {type: 'string'},
                  provider: {type: 'string'},
                },
              },
            },
          },
        },

      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(AccountPayable, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountPayable>
  ): Promise<object> {
    return this.accountPayableService.findById(id, filter);
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
    await this.accountPayableService.updateById(id, accountPayable);
  }


  // @del('/account-payables/{id}')
  // @response(204, {
  //   description: 'AccountPayable DELETE success',
  // })
  // async deleteById(@param.path.number('id') id: number): Promise<void> {
  //   await this.accountPayableRepository.deleteById(id);
  // }
}
