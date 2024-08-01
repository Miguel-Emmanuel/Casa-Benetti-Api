import {authenticate} from '@loopback/authentication';
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
import {DeliveryRequest} from '../models';
import {DeliveryRequestService} from '../services';

@authenticate('jwt')
export class DeliveryRequestController {
    constructor(
        @service()
        public deliveryRequestService: DeliveryRequestService
    ) { }

    // @post('/delivery-requests')
    // @response(200, {
    //     description: 'DeliveryRequest model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(DeliveryRequest)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(DeliveryRequest, {
    //                     title: 'NewDeliveryRequest',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     deliveryRequest: Omit<DeliveryRequest, 'id'>,
    // ): Promise<DeliveryRequest> {
    //     return this.deliveryRequestRepository.create(deliveryRequest);
    // }


    @get('/delivery-requests')
    @response(200, {
        description: 'Array of DeliveryRequest model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'number'
                            },
                            customerName: {
                                type: 'string'
                            },
                            quantity: {
                                type: 'number'
                            },
                            deliveryDay: {
                                type: 'string',
                                format: 'date-time'
                            },
                            status: {
                                type: 'string'
                            },
                        }
                    },
                },
            },
        },
    })
    async find(
        @param.filter(DeliveryRequest) filter?: Filter<DeliveryRequest>,
    ): Promise<Object[]> {
        return this.deliveryRequestService.find(filter);
    }

    @get('/delivery-requests/{id}')
    @response(200, {
        description: 'DeliveryRequest model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(DeliveryRequest, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(DeliveryRequest, {exclude: 'where'}) filter?: FilterExcludingWhere<DeliveryRequest>
    ): Promise<DeliveryRequest> {
        return this.deliveryRequestService.findById(id, filter);
    }

    // @patch('/delivery-requests/{id}')
    // @response(204, {
    //     description: 'DeliveryRequest PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(DeliveryRequest, {partial: true}),
    //             },
    //         },
    //     })
    //     deliveryRequest: DeliveryRequest,
    // ): Promise<void> {
    //     await this.deliveryRequestRepository.updateById(id, deliveryRequest);
    // }

    // @del('/delivery-requests/{id}')
    // @response(204, {
    //     description: 'DeliveryRequest DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.deliveryRequestRepository.deleteById(id);
    // }
}
