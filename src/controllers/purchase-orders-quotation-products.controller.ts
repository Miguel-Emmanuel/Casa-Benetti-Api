import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  PurchaseOrders,
  QuotationProducts,
} from '../models';
import {PurchaseOrdersRepository} from '../repositories';

export class PurchaseOrdersQuotationProductsController {
  constructor(
    @repository(PurchaseOrdersRepository) protected purchaseOrdersRepository: PurchaseOrdersRepository,
  ) { }

  @get('/purchase-orders/{id}/quotation-products', {
    responses: {
      '200': {
        description: 'Array of PurchaseOrders has many QuotationProducts',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(QuotationProducts)},
          },
        },
      },
    },
  })
  async find(
    @param.path.number('id') id: number,
    @param.query.object('filter') filter?: Filter<QuotationProducts>,
  ): Promise<QuotationProducts[]> {
    return this.purchaseOrdersRepository.quotationProducts(id).find(filter);
  }

  @post('/purchase-orders/{id}/quotation-products', {
    responses: {
      '200': {
        description: 'PurchaseOrders model instance',
        content: {'application/json': {schema: getModelSchemaRef(QuotationProducts)}},
      },
    },
  })
  async create(
    @param.path.number('id') id: typeof PurchaseOrders.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(QuotationProducts, {
            title: 'NewQuotationProductsInPurchaseOrders',
            exclude: ['id'],
            optional: ['purchaseOrdersId']
          }),
        },
      },
    }) quotationProducts: Omit<QuotationProducts, 'id'>,
  ): Promise<QuotationProducts> {
    return this.purchaseOrdersRepository.quotationProducts(id).create(quotationProducts);
  }

  @patch('/purchase-orders/{id}/quotation-products', {
    responses: {
      '200': {
        description: 'PurchaseOrders.QuotationProducts PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(QuotationProducts, {partial: true}),
        },
      },
    })
    quotationProducts: Partial<QuotationProducts>,
    @param.query.object('where', getWhereSchemaFor(QuotationProducts)) where?: Where<QuotationProducts>,
  ): Promise<Count> {
    return this.purchaseOrdersRepository.quotationProducts(id).patch(quotationProducts, where);
  }

  @del('/purchase-orders/{id}/quotation-products', {
    responses: {
      '200': {
        description: 'PurchaseOrders.QuotationProducts DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.number('id') id: number,
    @param.query.object('where', getWhereSchemaFor(QuotationProducts)) where?: Where<QuotationProducts>,
  ): Promise<Count> {
    return this.purchaseOrdersRepository.quotationProducts(id).delete(where);
  }
}
