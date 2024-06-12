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
import {Quotation} from '../models';
import {QuotationService} from '../services';

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
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Quotation, {
                        title: 'NewQuotation',
                        exclude: ['id'],
                    }),
                },
            },
        })
        quotation: Omit<Quotation, 'id'>,
    ): Promise<Quotation> {
        return this.quotationService.create(quotation);
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
    @response(200, {
        description: 'Array of Quotation model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Quotation, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(Quotation) filter?: Filter<Quotation>,
    ): Promise<Quotation[]> {
        return this.quotationService.find(filter);
    }


    @get('/quotations/{id}')
    @response(200, {
        description: 'Quotation model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Quotation, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Quotation, {exclude: 'where'}) filter?: FilterExcludingWhere<Quotation>
    ): Promise<Quotation> {
        return this.quotationService.findById(id, filter);
    }

    @patch('/quotations/{id}')
    @response(204, {
        description: 'Quotation PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Quotation, {partial: true}),
                },
            },
        })
        quotation: Quotation,
    ): Promise<void> {
        await this.quotationService.updateById(id, quotation);
    }

    @del('/quotations/{id}')
    @response(204, {
        description: 'Quotation DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.quotationService.deleteById(id);
    }
}
