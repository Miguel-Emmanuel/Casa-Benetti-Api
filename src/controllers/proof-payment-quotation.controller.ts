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
import {ProofPaymentQuotation, ProofPaymentQuotationCreate} from '../models';
import {ProofPaymentQuotationService} from '../services';

@authenticate('jwt')
export class ProofPaymentQuotationController {
    constructor(
        @service()
        public proofPaymentQuotationService: ProofPaymentQuotationService
    ) { }

    @post('/proof-payment-quotations')
    @response(200, {
        description: 'ProofPaymentQuotation model instance',
        content: {'application/json': {schema: getModelSchemaRef(ProofPaymentQuotation)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(ProofPaymentQuotationCreate, {
                        title: 'NewProofPaymentQuotation',
                        exclude: ['id'],
                    }),
                },
            },
        })
        proofPaymentQuotation: Omit<ProofPaymentQuotationCreate, 'id'>,
    ): Promise<ProofPaymentQuotation> {
        return this.proofPaymentQuotationService.create(proofPaymentQuotation);
    }

    @get('/proof-payment-quotations/count')
    @response(200, {
        description: 'ProofPaymentQuotation model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(ProofPaymentQuotation) where?: Where<ProofPaymentQuotation>,
    ): Promise<Count> {
        return this.proofPaymentQuotationService.count(where);
    }

    @get('/proof-payment-quotations')
    @response(200, {
        description: 'Array of ProofPaymentQuotation model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(ProofPaymentQuotation, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(ProofPaymentQuotation) filter?: Filter<ProofPaymentQuotation>,
    ): Promise<ProofPaymentQuotation[]> {
        return this.proofPaymentQuotationService.find(filter);
    }

    @get('/proof-payment-quotations/{id}')
    @response(200, {
        description: 'ProofPaymentQuotation model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(ProofPaymentQuotation, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(ProofPaymentQuotation, {exclude: 'where'}) filter?: FilterExcludingWhere<ProofPaymentQuotation>
    ): Promise<ProofPaymentQuotation> {
        return this.proofPaymentQuotationService.findById(id, filter);
    }

    @patch('/proof-payment-quotations/{id}')
    @response(204, {
        description: 'ProofPaymentQuotation PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(ProofPaymentQuotation, {partial: true}),
                },
            },
        })
        proofPaymentQuotation: ProofPaymentQuotation,
    ): Promise<void> {
        await this.proofPaymentQuotationService.updateById(id, proofPaymentQuotation);
    }

    @del('/proof-payment-quotations/{id}')
    @response(204, {
        description: 'ProofPaymentQuotation DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.proofPaymentQuotationService.deleteById(id);
    }
}
