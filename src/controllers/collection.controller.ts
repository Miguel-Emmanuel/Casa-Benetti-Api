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
import {CollectionDestinationE} from '../enums';
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
                            products: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'number'
                                        },
                                        SKU: {
                                            type: 'string'
                                        },
                                        image: {
                                            type: 'string'
                                        },
                                        description: {
                                            type: 'string'
                                        },
                                    }
                                }
                            }
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

    @patch('/collections/{id}')
    @response(200, {
        description: 'Collection model instance',
        content: {'application/json': {schema: getModelSchemaRef(Collection)}},
    })
    async updateById(
        @param.path.number('id') id: number,
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
    ): Promise<Object> {
        return this.collectionService.updateById(id, collection);
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
    ): Promise<Object[]> {
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
    ): Promise<Object> {
        return this.collectionService.findById(id, filter);
    }


    @patch('/collections/{id}/feedback')
    @response(204, {
        description: 'collections order PATCH success',
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
    async setFeedback(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            containerId: {
                                type: 'number',
                                nullable: true,
                            },
                            destination: {
                                type: 'string',
                            },
                            dateCollection: {
                                type: 'string',
                                format: 'date-time'
                            },
                            documents: {
                                type: 'array',
                                items: {
                                    properties: {
                                        id: {type: 'number'},
                                        fileURL: {type: 'string'},
                                        name: {type: 'string'},
                                        extension: {type: 'string'}
                                    }
                                }
                            }
                        }
                    }
                },
            },
        })
        data: {destination: CollectionDestinationE, dateCollection: Date, containerId: number, documents: {fileURL: string, name: string, extension: string, id?: number}[]},
    ): Promise<void> {
        await this.collectionService.setFeedback(id, data);
    }

    // @patch('/collections/{id}')
    // @response(204, {
    //     description: 'Collection PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(Collection, {partial: true}),
    //             },
    //         },
    //     })
    //     collection: Collection,
    // ): Promise<void> {
    //     await this.collectionService.updateById(id, collection);
    // }

    // @del('/collections/{id}')
    // @response(204, {
    //     description: 'Collection DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.collectionRepository.deleteById(id);
    // }
}
