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
import {UpdateContainer, UpdateContainerProducts} from '../interface';
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

    @get('/containers/entry')
    @response(200, {
        description: 'Array of Container model instances',
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
                            containerNumber: {
                                type: 'string'
                            },
                            status: {
                                type: 'string'
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
                                }
                            },
                        }
                    }
                },
            },
        },
    })
    async getContainerEntry(
    ): Promise<Object[]> {
        return this.containerService.getContainerEntry();
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

    @get('/containers/download/carta-traduccion/{id}')
    @response(200, {
        description: 'Container model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Container, {includeRelations: false}),
            },
        },
    })
    async createCartaTraduccion(
        @param.path.number('id') id: number,
    ): Promise<any> {
        return this.containerService.createCartaTraduccion(id);
    }

    @get('/containers/download/carta-porte/{id}')
    @response(200, {
        description: 'Container model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Container, {includeRelations: false}),
            },
        },
    })
    async createCartaPorte(
        @param.path.number('id') id: number,
    ): Promise<any> {
        return this.containerService.createCartaPorte(id);
    }

    @get('/containers/download/archivo-etiquetas/{id}')
    @response(200, {
        description: 'Container model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Container, {includeRelations: false}),
            },
        },
    })
    async createArchivoEtiquetas(
        @param.path.number('id') id: number,
    ): Promise<any> {
        return this.containerService.createArchivoEtiquetas(id);
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
                                                    invoiceNumber: {
                                                        type: 'string'
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


    @patch('/containers/{id}/products')
    @response(204, {
        description: 'Container PATCH success',
    })
    async updateByIdProducts(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
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
                                                    invoiceNumber: {
                                                        type: 'string'
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
        container: UpdateContainerProducts,
    ): Promise<void> {
        await this.containerService.updateByIdProducts(id, container);
    }

    // @del('/containers/{id}')
    // @response(204, {
    //     description: 'Container DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.containerService.deleteById(id);
    // }
}
