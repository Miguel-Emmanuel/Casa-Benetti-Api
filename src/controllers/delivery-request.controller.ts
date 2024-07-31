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
import {DeliveryRequest} from '../models';
import {DeliveryRequestRepository} from '../repositories';

export class DeliveryRequestController {
    constructor(
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
    ) { }

    @post('/delivery-requests')
    @response(200, {
        description: 'DeliveryRequest model instance',
        content: {'application/json': {schema: getModelSchemaRef(DeliveryRequest)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(DeliveryRequest, {
                        title: 'NewDeliveryRequest',
                        exclude: ['id'],
                    }),
                },
            },
        })
        deliveryRequest: Omit<DeliveryRequest, 'id'>,
    ): Promise<DeliveryRequest> {
        return this.deliveryRequestRepository.create(deliveryRequest);
    }

    @get('/delivery-requests/count')
    @response(200, {
        description: 'DeliveryRequest model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(DeliveryRequest) where?: Where<DeliveryRequest>,
    ): Promise<Count> {
        return this.deliveryRequestRepository.count(where);
    }

    @get('/delivery-requests')
    @response(200, {
        description: 'Array of DeliveryRequest model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(DeliveryRequest, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(DeliveryRequest) filter?: Filter<DeliveryRequest>,
    ): Promise<DeliveryRequest[]> {
        return this.deliveryRequestRepository.find(filter);
    }

    @patch('/delivery-requests')
    @response(200, {
        description: 'DeliveryRequest PATCH success count',
        content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(DeliveryRequest, {partial: true}),
                },
            },
        })
        deliveryRequest: DeliveryRequest,
        @param.where(DeliveryRequest) where?: Where<DeliveryRequest>,
    ): Promise<Count> {
        return this.deliveryRequestRepository.updateAll(deliveryRequest, where);
    }

    @get('/delivery-requests/{id}')
    @response(200, {
        description: 'DeliveryRequest model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(DeliveryRequest, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(DeliveryRequest, {exclude: 'where'}) filter?: FilterExcludingWhere<DeliveryRequest>
    ): Promise<DeliveryRequest> {
        return this.deliveryRequestRepository.findById(id, filter);
    }

    @patch('/delivery-requests/{id}')
    @response(204, {
        description: 'DeliveryRequest PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(DeliveryRequest, {partial: true}),
                },
            },
        })
        deliveryRequest: DeliveryRequest,
    ): Promise<void> {
        await this.deliveryRequestRepository.updateById(id, deliveryRequest);
    }

    @put('/delivery-requests/{id}')
    @response(204, {
        description: 'DeliveryRequest PUT success',
    })
    async replaceById(
        @param.path.number('id') id: number,
        @requestBody() deliveryRequest: DeliveryRequest,
    ): Promise<void> {
        await this.deliveryRequestRepository.replaceById(id, deliveryRequest);
    }

    @del('/delivery-requests/{id}')
    @response(204, {
        description: 'DeliveryRequest DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.deliveryRequestRepository.deleteById(id);
    }
}
