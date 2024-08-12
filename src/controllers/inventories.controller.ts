import {service} from '@loopback/core';
import {
    get,
    param,
    response
} from '@loopback/rest';
import {InventoriesService} from '../services';

// @authenticate('jwt')
export class InventoriesController {
    constructor(
        @service()
        public inventoriesService: InventoriesService
    ) { }

    // @post('/inventories')
    // @response(200, {
    //     description: 'Inventories model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(Inventories)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(Inventories, {
    //                     title: 'NewInventories',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     inventories: Omit<Inventories, 'id'>,
    // ): Promise<Inventories> {
    //     return this.inventoriesRepository.create(inventories);
    // }


    @get('/inventories')
    @response(200, {
        description: 'Array of Inventories model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            warehouse: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'string'
                                        },
                                        name: {
                                            type: 'string',
                                        },
                                        products: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: {
                                                        type: 'number'
                                                    },
                                                    name: {
                                                        type: 'string'
                                                    },
                                                    sku: {
                                                        type: 'string'
                                                    },
                                                    stock: {
                                                        type: 'number'
                                                    },
                                                    image: {
                                                        type: 'string'
                                                    },
                                                    classificationId: {
                                                        type: 'number'
                                                    },
                                                    lineId: {
                                                        type: 'number'
                                                    },
                                                    brandId: {
                                                        type: 'number'
                                                    },
                                                    model: {
                                                        type: 'string'
                                                    },
                                                    originCode: {
                                                        type: 'string'
                                                    },
                                                    boxes: {
                                                        type: 'number'
                                                    },
                                                    description: {
                                                        type: 'string'
                                                    },
                                                    observations: {
                                                        type: 'string'
                                                    },
                                                    assembledProducts: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: {
                                                                    type: 'number'
                                                                },
                                                                description: {
                                                                    type: 'string'
                                                                },
                                                                mainMaterial: {
                                                                    type: 'string'
                                                                },
                                                                mainFinish: {
                                                                    type: 'string'
                                                                },
                                                                secondaryMaterial: {
                                                                    type: 'string'
                                                                },
                                                                secondaryFinishing: {
                                                                    type: 'string'
                                                                },
                                                                quantity: {
                                                                    type: 'number'
                                                                },
                                                                image: {
                                                                    type: 'string'
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            showroom: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'string'
                                        },
                                        name: {
                                            type: 'string',
                                        },
                                        products: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: {
                                                        type: 'number'
                                                    },
                                                    name: {
                                                        type: 'string'
                                                    },
                                                    sku: {
                                                        type: 'string'
                                                    },
                                                    stock: {
                                                        type: 'number'
                                                    },
                                                    image: {
                                                        type: 'string'
                                                    },
                                                    classificationId: {
                                                        type: 'number'
                                                    },
                                                    lineId: {
                                                        type: 'number'
                                                    },
                                                    brandId: {
                                                        type: 'number'
                                                    },
                                                    model: {
                                                        type: 'string'
                                                    },
                                                    originCode: {
                                                        type: 'string'
                                                    },
                                                    boxes: {
                                                        type: 'number'
                                                    },
                                                    description: {
                                                        type: 'string'
                                                    },
                                                    observations: {
                                                        type: 'string'
                                                    },
                                                    assembledProducts: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: {
                                                                    type: 'number'
                                                                },
                                                                description: {
                                                                    type: 'string'
                                                                },
                                                                mainMaterial: {
                                                                    type: 'string'
                                                                },
                                                                mainFinish: {
                                                                    type: 'string'
                                                                },
                                                                secondaryMaterial: {
                                                                    type: 'string'
                                                                },
                                                                secondaryFinishing: {
                                                                    type: 'string'
                                                                },
                                                                quantity: {
                                                                    type: 'number'
                                                                },
                                                                image: {
                                                                    type: 'string'
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },

                        }
                    },
                },
            },
        },
    })
    async find(
    ): Promise<Object> {
        return this.inventoriesService.find();
    }

    @get('/inventories/{inventoryMovementId}/product')
    @response(200, {
        description: 'Array of Inventories model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string'
                        },
                        name: {
                            type: 'string',
                        },
                        products: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'number'
                                    },
                                    name: {
                                        type: 'string'
                                    },
                                    sku: {
                                        type: 'string'
                                    },
                                    stock: {
                                        type: 'number'
                                    },
                                    image: {
                                        type: 'string'
                                    },
                                    classificationId: {
                                        type: 'number'
                                    },
                                    lineId: {
                                        type: 'number'
                                    },
                                    brandId: {
                                        type: 'number'
                                    },
                                    model: {
                                        type: 'string'
                                    },
                                    originCode: {
                                        type: 'string'
                                    },
                                    boxes: {
                                        type: 'number'
                                    },
                                    description: {
                                        type: 'string'
                                    },
                                    observations: {
                                        type: 'string'
                                    },
                                    assembledProducts: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'number'
                                                },
                                                description: {
                                                    type: 'string'
                                                },
                                                mainMaterial: {
                                                    type: 'string'
                                                },
                                                mainFinish: {
                                                    type: 'string'
                                                },
                                                secondaryMaterial: {
                                                    type: 'string'
                                                },
                                                secondaryFinishing: {
                                                    type: 'string'
                                                },
                                                quantity: {
                                                    type: 'number'
                                                },
                                                image: {
                                                    type: 'string'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
        },
    })
    async getDetailProduct(
        @param.path.number('inventoryMovementId') inventoryMovementId: number,
    ): Promise<Object> {
        return this.inventoriesService.getDetailProduct(inventoryMovementId);
    }

    // @get('/inventories/{id}')
    // @response(200, {
    //     description: 'Inventories model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(Inventories, {includeRelations: false}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(Inventories, {exclude: 'where'}) filter?: FilterExcludingWhere<Inventories>
    // ): Promise<Inventories> {
    //     return this.inventoriesRepository.findById(id, filter);
    // }

    // @patch('/inventories/{id}')
    // @response(204, {
    //     description: 'Inventories PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(Inventories, {partial: true}),
    //             },
    //         },
    //     })
    //     inventories: Inventories,
    // ): Promise<void> {
    //     await this.inventoriesRepository.updateById(id, inventories);
    // }

    // @del('/inventories/{id}')
    // @response(204, {
    //     description: 'Inventories DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.inventoriesRepository.deleteById(id);
    // }
}
