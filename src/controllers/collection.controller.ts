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
    patch,
    post,
    requestBody,
    response
} from '@loopback/rest';
import {Collection} from '../models';
import {CollectionService} from '../services';

@authenticate('jwt')
export class CollectionController {
    constructor(
        @service()
        public collectionService: CollectionService
    ) { }

    @get('/collections/earrings-collect')
    @response(200, {
        description: 'Array of Collection model instances',
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
    async earringsCollect(
    ): Promise<Object[]> {
        return this.collectionService.earringsCollect();
    }

    @post('/collections')
    @response(200, {
        description: 'Collection model instance',
        content: {'application/json': {schema: getModelSchemaRef(Collection)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            destination: {
                                type: 'string',
                            },
                            dateCollection: {
                                type: 'string',
                                format: 'date-time'
                            },
                            purchaseOrders: {
                                type: 'array',
                                items: {
                                    type: 'number'
                                }
                            }
                        }
                    }
                },
            },
        })
        collection: {destination: string, dateCollection: Date, purchaseOrders: number[]}
    ): Promise<Collection> {
        return this.collectionService.create(collection);
    }

    @get('/collections')
    @response(200, {
        description: 'Array of Collection model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Collection, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Collection) filter?: Filter<Collection>,
    ): Promise<Collection[]> {
        return this.collectionService.find(filter);
    }

    @get('/collections/{id}')
    @response(200, {
        description: 'Collection model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Collection, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Collection, {exclude: 'where'}) filter?: FilterExcludingWhere<Collection>
    ): Promise<Collection> {
        return this.collectionService.findById(id, filter);
    }

    @patch('/collections/{id}')
    @response(204, {
        description: 'Collection PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Collection, {partial: true}),
                },
            },
        })
        collection: Collection,
    ): Promise<void> {
        await this.collectionService.updateById(id, collection);
    }

    // @del('/collections/{id}')
    // @response(204, {
    //     description: 'Collection DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.collectionRepository.deleteById(id);
    // }
}
