import {authenticate} from '@loopback/authentication';
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
import {Document, Proforma} from '../models';
import {ProformaService} from '../services';

@authenticate('jwt')
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
          schema: {
            type: "object",
            properties: {
              proforma: getModelSchemaRef(Proforma, {
                title: 'NewProforma',
                exclude: ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment',],
              },),
              document: {
                type: 'object',
                nullable: true,
                properties: {
                  fileURL: {type: 'string'},
                  name: {type: 'string'},
                  extension: {type: 'string'}
                }
              },
            }
          },
        },
      },
    })
    data: {
      proforma: Omit<Proforma, 'id'>,
      document: Document
    }
  ): Promise<object> {
    return this.proformaService.create(data);
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
          items: {
            type: 'object',
            properties: {
              hola: {
                type: 'number'
              },
              proformaId: {
                type: 'string'
              },
              brandName: {
                type: 'string'
              },
              proformaDate: {
                type: 'string',
                format: 'date-time'
              },
              proformaAmount: {
                type: 'number'
              },
              currency: {
                type: 'string'
              },
              document: {
                type: 'object',
                properties: {
                  id: {
                    type: 'number'
                  },
                  fileURL: {
                    type: 'string'
                  },
                  name: {
                    type: 'string'
                  },
                  extension: {
                    type: 'string'
                  },
                }
              },
            }
          }
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
          schema: {
            type: "object",
            properties: {
              proforma: getModelSchemaRef(Proforma, {
                partial: true,
                title: 'NewProforma',
                exclude: ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment',],
              },
              ),
              document: {
                type: 'object',
                nullable: true,
                properties: {
                  fileURL: {type: 'string'},
                  name: {type: 'string'},
                  extension: {type: 'string'}
                }
              },
            },
          },
        },
      },
    })
    data: {
      proforma: Omit<Proforma, 'id'>,
      document: Document
    }
  ): Promise<void> {
    await this.proformaService.updateById(id, data);
  }
}
