import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    Where
} from '@loopback/repository';
import {
    del,
    get,
    getModelSchemaRef,
    param,
    patch,
    post,
    requestBody,
    response
} from '@loopback/rest';
import {CreateRequestBody, QuotationFindResponseSwagger, QuotationGteByIdResponse, UpdateRequestBody} from '../RequestBody/quotation.request';
import {CreateQuotation, QuotationFindOneResponse, QuotationFindResponse, UpdateQuotation} from '../interface';
import {Quotation} from '../models';
import {QuotationService} from '../services';

@authenticate('jwt')
export class QuotationController {
    constructor(
        @service()
        public quotationService: QuotationService,
    ) { }

    @post('/quotations')
    @response(200, {
        description: 'Quotation model instance',
        content: {'application/json': {schema: getModelSchemaRef(Quotation)}},
    })
    async create(
        @requestBody(CreateRequestBody)
        data: CreateQuotation,
    ): Promise<Quotation> {
        return this.quotationService.create(data);
    }

    @get('/quotations/count')
    @response(200, {
        description: 'Quotation model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Quotation) where?: Where<Quotation>,
    ): Promise<Count> {
        return this.quotationService.count(where);
    }

    @get('/quotations')
    @response(200, QuotationFindResponseSwagger)
    async find(
        @param.filter(Quotation) filter?: Filter<Quotation>,
    ): Promise<QuotationFindResponse[]> {
        return this.quotationService.find(filter);
    }


    @get('/quotations/{id}')
    @response(200, QuotationGteByIdResponse)
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Quotation, {exclude: 'where'}) filter?: FilterExcludingWhere<Quotation>
    ): Promise<QuotationFindOneResponse> {
        return this.quotationService.findById(id, filter);
    }

    @patch('/quotations/{id}')
    @response(200, {
        description: 'Quotation model instance',
        content: {'application/json': {schema: getModelSchemaRef(Quotation)}},
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody(UpdateRequestBody)
        data: UpdateQuotation,
    ): Promise<void> {
        await this.quotationService.updateById(id, data);
    }

    @del('/quotations/{id}')
    @response(204, {
        description: 'Quotation DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.quotationService.deleteById(id);
    }


    @patch('/quotations/status-revision-administracion/{id}')
    @response(200, {
        description: 'customer model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {type: 'string', example: 'En hora buena! La acción se ha realizado con éxito'}
                    }
                }
            },
        },
    })
    async changeStatusToReviewAdmin(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            fractionate: {type: 'boolean'},
                            isRejected: {type: 'boolean'},
                            comment: {type: 'boolean'},
                        }
                    },
                },
            },
        })
        body: {fractionate: boolean, isRejected: boolean, comment: string},
    ): Promise<object> {
        return this.quotationService.changeStatusToReviewAdmin(id, body);
    }


    @patch('/quotations/status-cerrada/{id}')
    @response(200, {
        description: 'customer model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {type: 'string', example: 'En hora buena! La acción se ha realizado con éxito'}
                    }
                }
            },
        },
    })
    async changeStatusToClose(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            isRejected: {type: 'boolean'},
                            comment: {type: 'string'},
                        }
                    },
                },
            },
        })
        body: {isRejected: boolean, comment: string},
    ): Promise<object> {
        return this.quotationService.changeStatusToClose(id, body);
    }
}
