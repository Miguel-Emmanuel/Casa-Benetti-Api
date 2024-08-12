import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
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
import {ProviderServiceBindings} from '../keys';
import {Provider} from '../models';
import {ProviderRepository} from '../repositories';
import {ProviderService} from '../services';

@authenticate('jwt')
export class ProviderController {
  constructor(
    @repository(ProviderRepository)
    public providerRepository: ProviderRepository,
    @inject(ProviderServiceBindings.PROVIDER_SERVICE)
    public providerService: ProviderService
  ) { }

  @post('/providers')
  @response(200, {
    description: 'Provider model instance',
    content: {'application/json': {schema: getModelSchemaRef(Provider)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Provider, {
            title: 'NewProvider',
            exclude: ['id'],
          }),
        },
      },
    })
    provider: Omit<Provider, 'id'>,
  ): Promise<object> {
    return this.providerService.create(provider);
  }

  @get('/providers/count')
  @response(200, {
    description: 'Provider model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Provider) where?: Where<Provider>,
  ): Promise<object> {
    return this.providerService.count(where);
  }

  @get('/providers')
  @response(200, {
    description: 'Array of Provider model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Provider, {includeRelations: false}),
        },
      },
    },
  })
  async find(
    @param.filter(Provider) filter?: Filter<Provider>,
  ): Promise<object> {
    return this.providerService.find(filter);
  }

  @get('/providers/{id}')
  @response(200, {
    description: 'Provider model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Provider, {includeRelations: false}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Provider, {exclude: 'where'}) filter?: FilterExcludingWhere<Provider>
  ): Promise<object> {
    return this.providerService.findById(id, filter);
  }

  @patch('/providers/{id}')
  @response(204, {
    description: 'Provider PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Provider, {partial: true}),
        },
      },
    })
    provider: Provider,
  ): Promise<void> {
    await this.providerService.updateById(id, provider);
  }
}
