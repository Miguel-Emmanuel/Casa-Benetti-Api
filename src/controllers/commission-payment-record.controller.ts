import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere
} from '@loopback/repository';
import {
    get,
    getModelSchemaRef,
    param,
    response
} from '@loopback/rest';
import {CommissionPaymentRecord} from '../models';
import {CommissionPaymentRecordService} from '../services';

export class CommissionPaymentRecordController {
    constructor(
        @service(CommissionPaymentRecordService)
        public commissionPaymentRecordService: CommissionPaymentRecordService,
    ) { }

    // @post('/commission-payment-records')
    // @response(200, {
    //     description: 'CommissionPaymentRecord model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(CommissionPaymentRecord)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(CommissionPaymentRecord, {
    //                     title: 'NewCommissionPaymentRecord',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     commissionPaymentRecord: Omit<CommissionPaymentRecord, 'id'>,
    // ): Promise<CommissionPaymentRecord> {
    //     return this.commissionPaymentRecordService.create(commissionPaymentRecord);
    // }

    @get('/commission-payment-records')
    @response(200, {
        description: 'Array of CommissionPaymentRecord model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(CommissionPaymentRecord, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(CommissionPaymentRecord) filter?: Filter<CommissionPaymentRecord>,
    ): Promise<CommissionPaymentRecord[]> {
        return this.commissionPaymentRecordService.find(filter);
    }


    @get('/commission-payment-records/{id}')
    @response(200, {
        description: 'CommissionPaymentRecord model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(CommissionPaymentRecord, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(CommissionPaymentRecord, {exclude: 'where'}) filter?: FilterExcludingWhere<CommissionPaymentRecord>
    ): Promise<CommissionPaymentRecord> {
        return this.commissionPaymentRecordService.findById(id, filter);
    }

    // @patch('/commission-payment-records/{id}')
    // @response(204, {
    //     description: 'CommissionPaymentRecord PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(CommissionPaymentRecord, {partial: true}),
    //             },
    //         },
    //     })
    //     commissionPaymentRecord: CommissionPaymentRecord,
    // ): Promise<void> {
    //     await this.commissionPaymentRecordService.updateById(id, commissionPaymentRecord);
    // }


    // @del('/commission-payment-records/{id}')
    // @response(204, {
    //     description: 'CommissionPaymentRecord DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.commissionPaymentRecordService.deleteById(id);
    // }
}
