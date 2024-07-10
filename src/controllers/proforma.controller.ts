import {service} from '@loopback/core';
import {
  CountSchema,
  Filter,
  FilterExcludingWhere,
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
import {Proforma} from '../models';
import {ProformaService} from '../services';

export class ProformaController {
  constructor(
    @service()
    public proformaService: ProformaService
  ) { }

  @post('/proformas')
  @response(200, {
    description: 'Proforma model instance',
    content: {'application/json': {schema: getModelSchemaRef(Proforma)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Proforma, {
            title: 'NewProforma',
            exclude: ['id'],
          }),
        },
      },
    })
    proforma: Omit<Proforma, 'id'>,
  ): Promise<object> {
    return this.proformaService.create(proforma);
  }

  @get('/proformas/count')
  @response(200, {
    description: 'Proforma model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Proforma) where?: Where<Proforma>,
  ): Promise<object> {
    return this.proformaService.count(where);
  }

  @get('/proformas')
  @response(200, {
    description: 'Array of Proforma model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Proforma, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Proforma) filter?: Filter<Proforma>,
  ): Promise<object> {
    return this.proformaService.find(filter);
  }

  @get('/proformas/{id}')
  @response(200, {
    description: 'Proforma model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Proforma, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Proforma, {exclude: 'where'}) filter?: FilterExcludingWhere<Proforma>
  ): Promise<object> {
    return this.proformaService.findById(id, filter);
  }

  @patch('/proformas/{id}')
  @response(204, {
    description: 'Proforma PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Proforma, {partial: true}),
        },
      },
    })
    proforma: Proforma,
  ): Promise<void> {
    await this.proformaService.updateById(id, proforma);
  }
}
