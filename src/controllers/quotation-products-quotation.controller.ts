import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  QuotationProducts,
  Quotation,
} from '../models';
import {QuotationProductsRepository} from '../repositories';

export class QuotationProductsQuotationController {
  constructor(
    @repository(QuotationProductsRepository)
    public quotationProductsRepository: QuotationProductsRepository,
  ) { }

  @get('/quotation-products/{id}/quotation', {
    responses: {
      '200': {
        description: 'Quotation belonging to QuotationProducts',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Quotation),
          },
        },
      },
    },
  })
  async getQuotation(
    @param.path.number('id') id: typeof QuotationProducts.prototype.id,
  ): Promise<Quotation> {
    return this.quotationProductsRepository.quotation(id);
  }
}
