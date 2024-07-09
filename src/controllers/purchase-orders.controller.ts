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
import {PurchaseOrders} from '../models';
import {PurchaseOrdersRepository} from '../repositories';

@authenticate('jwt')
export class PurchaseOrdersController {
  constructor(
    @repository(PurchaseOrdersRepository)
    public purchaseOrdersRepository: PurchaseOrdersRepository,
  ) { }

  @post('/purchase-orders')
  @response(200, {
    description: 'PurchaseOrders model instance',
    content: {'application/json': {schema: getModelSchemaRef(PurchaseOrders)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrders, {
            title: 'NewPurchaseOrders',
            exclude: ['id'],
          }),
        },
      },
    })
    purchaseOrders: Omit<PurchaseOrders, 'id'>,
  ): Promise<PurchaseOrders> {
    return this.purchaseOrdersRepository.create(purchaseOrders);
  }

  @get('/purchase-orders/count')
  @response(200, {
    description: 'PurchaseOrders model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(PurchaseOrders) where?: Where<PurchaseOrders>,
  ): Promise<Count> {
    return this.purchaseOrdersRepository.count(where);
  }

  @get('/purchase-orders')
  @response(200, {
    description: 'Array of PurchaseOrders model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(PurchaseOrders, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(PurchaseOrders) filter?: Filter<PurchaseOrders>,
  ): Promise<PurchaseOrders[]> {
    return this.purchaseOrdersRepository.find(filter);
  }

  @patch('/purchase-orders')
  @response(200, {
    description: 'PurchaseOrders PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrders, {partial: true}),
        },
      },
    })
    purchaseOrders: PurchaseOrders,
    @param.where(PurchaseOrders) where?: Where<PurchaseOrders>,
  ): Promise<Count> {
    return this.purchaseOrdersRepository.updateAll(purchaseOrders, where);
  }

  @get('/purchase-orders/{id}')
  @response(200, {
    description: 'PurchaseOrders model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(PurchaseOrders, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(PurchaseOrders, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrders>
  ): Promise<PurchaseOrders> {
    return this.purchaseOrdersRepository.findById(id, filter);
  }

  @patch('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrders PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PurchaseOrders, {partial: true}),
        },
      },
    })
    purchaseOrders: PurchaseOrders,
  ): Promise<void> {
    await this.purchaseOrdersRepository.updateById(id, purchaseOrders);
  }

  @put('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrders PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() purchaseOrders: PurchaseOrders,
  ): Promise<void> {
    await this.purchaseOrdersRepository.replaceById(id, purchaseOrders);
  }

  @del('/purchase-orders/{id}')
  @response(204, {
    description: 'PurchaseOrders DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.purchaseOrdersRepository.deleteById(id);
  }
}
