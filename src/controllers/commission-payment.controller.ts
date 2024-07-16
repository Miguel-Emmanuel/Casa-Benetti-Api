import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere
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
import {CommissionPayment, CommissionPaymentCreate} from '../models';
import {CommissionPaymentService} from '../services';

export class CommissionPaymentController {
    constructor(
        @service()
        public commissionPaymentService: CommissionPaymentService
    ) { }

    @post('/commission-payments')
    @response(200, {
        description: 'CommissionPayment model instance',
        content: {'application/json': {schema: getModelSchemaRef(CommissionPayment)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(CommissionPaymentCreate, {
                        title: 'NewCommissionPayment',
                        exclude: ['id', 'createdAt', 'status'],
                    }),
                },
            },
        })
        commissionPayment: Omit<CommissionPaymentCreate, 'id'>,
    ): Promise<CommissionPayment> {
        return this.commissionPaymentService.create(commissionPayment);
    }

    @get('/commission-payments')
    @response(200, {
        description: 'Array of CommissionPayment model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(CommissionPayment, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(CommissionPayment) filter?: Filter<CommissionPayment>,
    ): Promise<CommissionPayment[]> {
        return this.commissionPaymentService.find(filter);
    }

    @get('/commission-payments/{id}')
    @response(200, {
        description: 'CommissionPayment model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(CommissionPayment, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(CommissionPayment, {exclude: 'where'}) filter?: FilterExcludingWhere<CommissionPayment>
    ): Promise<CommissionPayment> {
        return this.commissionPaymentService.findById(id, filter);
    }

    @patch('/commission-payments/{id}')
    @response(204, {
        description: 'CommissionPayment PATCH success',
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
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(CommissionPaymentCreate, {partial: true, exclude: ['id']}),
                },
            },
        })
        commissionPayment: CommissionPaymentCreate,
    ): Promise<void> {
        await this.commissionPaymentService.updateById(id, commissionPayment);
    }

    @del('/commission-payments/{id}')
    @response(204, {
        description: 'CommissionPayment DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.commissionPaymentService.deleteById(id);
    }
}
