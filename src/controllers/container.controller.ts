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
import {UpdateContainer} from '../interface';
import {Container, ContainerCreate} from '../models';
import {ContainerService} from '../services';

@authenticate('jwt')
export class ContainerController {
    constructor(
        @service()
        public containerService: ContainerService
    ) { }

    @post('/containers')
    @response(200, {
        description: 'Container model instance',
        content: {'application/json': {schema: getModelSchemaRef(Container)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(ContainerCreate, {
                        title: 'NewContainer',
                        exclude: ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isDeleted', 'deleteComment', 'status', 'arrivalDate', 'shippingDate'],
                    }),
                },
            },
        })
        container: Omit<ContainerCreate, 'id'>,
    ): Promise<Container> {
        return this.containerService.create(container);
    }

    @get('/containers')
    @response(200, {
        description: 'Array of Container model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Container, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Container) filter?: Filter<Container>,
    ): Promise<Object[]> {
        return this.containerService.find(filter);
    }

    @get('/containers/{id}')
    @response(200, {
        description: 'Container model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Container, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Container, {exclude: 'where'}) filter?: FilterExcludingWhere<Container>
    ): Promise<Object> {
        return this.containerService.findById(id, filter);
    }

    @patch('/containers/{id}')
    @response(204, {
        description: 'Container PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            pedimento: {
                                type: 'string'
                            },
                            grossWeight: {
                                type: 'string'
                            },
                            numberBoxes: {
                                type: 'number'
                            },
                            measures: {
                                type: 'string'
                            },
                            status: {
                                type: 'string'
                            },
                            // ETDDate: {
                            //     type: 'string',
                            //     format: 'date-time'
                            // },
                            // ETADate: {
                            //     type: 'string',
                            //     format: 'date-time'
                            // },
                            docs: {
                                type: 'array',
                                items: {
                                    properties: {
                                        id: {type: 'number'},
                                        fileURL: {type: 'string'},
                                        name: {type: 'string'},
                                        extension: {type: 'string'}
                                    }
                                }
                            },
                            purchaseOrders: {
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
                                                    grossWeight: {
                                                        type: 'string'
                                                    },
                                                    netWeight: {
                                                        type: 'string'
                                                    },
                                                    numberBoxes: {
                                                        type: 'number'
                                                    },
                                                    descriptionPedimiento: {
                                                        type: 'string'
                                                    },
                                                    NOMS: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'string'
                                                        }
                                                    },

                                                }
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                },
            },
        })
        container: UpdateContainer,
    ): Promise<void> {
        await this.containerService.updateById(id, container);
    }

    // @del('/containers/{id}')
    // @response(204, {
    //     description: 'Container DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.containerService.deleteById(id);
    // }
}
