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
import {AdvancePaymentRecord, AdvancePaymentRecordCreate} from '../models';
import {AdvancePaymentRecordService} from '../services';
@authenticate('jwt')
export class AdvancePaymentRecordController {
    constructor(
        @service()
        public advancePaymentRecordService: AdvancePaymentRecordService
    ) { }

    @post('/advance-payment-records')
    @response(200, {
        description: 'AdvancePaymentRecord model instance',
        content: {'application/json': {schema: getModelSchemaRef(AdvancePaymentRecord)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AdvancePaymentRecordCreate, {
                        title: 'NewAdvancePaymentRecord',
                        exclude: ['id', 'consecutiveId', 'projectId', 'createdAt', 'status'],
                    }),
                },
            },
        })
        advancePaymentRecord: Omit<AdvancePaymentRecordCreate, 'id'>,
    ): Promise<AdvancePaymentRecord> {
        return this.advancePaymentRecordService.create(advancePaymentRecord);
    }

    @get('/advance-payment-records/count')
    @response(200, {
        description: 'AdvancePaymentRecord model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(AdvancePaymentRecord) where?: Where<AdvancePaymentRecord>,
    ): Promise<Count> {
        return this.advancePaymentRecordService.count(where);
    }

    @get('/advance-payment-records')
    @response(200, {
        description: 'Array of AdvancePaymentRecord model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(AdvancePaymentRecord),
                },
            },
        },
    })
    async find(
        @param.filter(AdvancePaymentRecord) filter?: Filter<AdvancePaymentRecord>,
    ): Promise<AdvancePaymentRecord[]> {
        return this.advancePaymentRecordService.find(filter);
    }

    @get('/advance-payment-records/{id}')
    @response(200, {
        description: 'AdvancePaymentRecord model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(AdvancePaymentRecord),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(AdvancePaymentRecord, {exclude: 'where'}) filter?: FilterExcludingWhere<AdvancePaymentRecord>
    ): Promise<AdvancePaymentRecord> {
        return this.advancePaymentRecordService.findById(id, filter);
    }

    @patch('/advance-payment-records/{id}')
    @response(204, {
        description: 'AdvancePaymentRecord PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AdvancePaymentRecordCreate, {partial: true, exclude: ['id', 'consecutiveId', 'projectId', 'createdAt',], }),
                },
            },
        })
        advancePaymentRecord: AdvancePaymentRecordCreate,
    ): Promise<void> {
        await this.advancePaymentRecordService.updateById(id, advancePaymentRecord);
    }

    @del('/advance-payment-records/{id}')
    @response(204, {
        description: 'AdvancePaymentRecord DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.advancePaymentRecordService.deleteById(id);
    }
}
