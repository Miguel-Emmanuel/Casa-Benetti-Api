import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Filter,
    repository
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
import {EntryDataI, IssueDataI} from '../interface';
import {InventoryMovements, QuotationProducts} from '../models';
import {InventoryMovementsRepository} from '../repositories';
import {InventoryMovementsService} from '../services';

@authenticate('jwt')
export class InventoryMovementsController {
    constructor(
        @repository(InventoryMovementsRepository)
        public inventoryMovementsRepository: InventoryMovementsRepository,
        @service()
        public inventoryMovementsService: InventoryMovementsService
    ) { }

    @post('/inventory-movements/entry')
    @response(200, {
        description: 'InventoryMovements model instance',
        content: {'application/json': {schema: getModelSchemaRef(InventoryMovements)}},
    })
    async entry(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            reasonEntry: {
                                type: 'string',
                            },
                            //Descarga contenedor, Descarga recolección
                            containerId: {
                                type: 'number',
                                nullable: true
                            },
                            collectionId: {
                                type: 'number',
                                nullable: true
                            },
                            purchaseOrders: {
                                type: 'array',
                                nullable: true,
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'number'
                                        },
                                        products: {
                                            type: 'array',
                                            nullable: true,
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    quotationProductsId: {
                                                        type: 'number'
                                                    },
                                                    quantity: {
                                                        type: 'number'
                                                    }
                                                }
                                            }
                                        },
                                    }
                                }
                            },
                            //Reparacion, Préstamo o Devolución
                            branchId: {
                                type: 'number',
                                nullable: true
                            },
                            warehouseId: {
                                type: 'number',
                                nullable: true
                            },
                            projectId: {
                                type: 'string',
                                nullable: true
                            },
                            quotationProductsId: {
                                type: 'number',
                                nullable: true
                            },
                            quantity: {
                                type: 'number',
                                nullable: true
                            },
                            comment: {
                                type: 'string',
                                nullable: true
                            },

                        }
                    }
                },
            },
        })
        data: EntryDataI,
    ): Promise<Object> {
        return this.inventoryMovementsService.entry(data);
    }

    @post('/inventory-movements/issue')
    @response(200, {
        description: 'InventoryMovements model instance',
        content: {'application/json': {schema: getModelSchemaRef(InventoryMovements)}},
    })
    async issue(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            branchId: {
                                type: 'number',
                                nullable: true
                            },
                            warehouseId: {
                                type: 'number',
                                nullable: true
                            },
                            quotationProductsId: {
                                type: 'number',
                            },
                            quantity: {
                                type: 'number',
                            },
                            reasonIssue: {
                                type: 'string',
                            },
                            comment: {
                                type: 'string',
                            },
                            containerId: {
                                type: 'number',
                                nullable: true
                            },
                            destinationBranchId: {
                                type: 'number',
                                nullable: true
                            },
                            destinationWarehouseId: {
                                type: 'number',
                                nullable: true
                            },
                        }
                    }
                },
            },
        })
        data: IssueDataI,
    ): Promise<Object> {
        return this.inventoryMovementsService.issue(data);
    }

    @get('/inventory-movements/{id}/collection/purchase-orders')
    @response(200, {
        description: 'Array of InventoryMovements model instances',
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
                                        numberBoxes: {
                                            type: 'number'
                                        },
                                        quantity: {
                                            type: 'number'
                                        },
                                        commentEntry: {
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
    async findCollection(
        @param.path.number('id') id: number,
    ): Promise<Object[]> {
        return this.inventoryMovementsService.findCollection(id);
    }

    @get('/inventory-movements/{id}/container/purchase-orders')
    @response(200, {
        description: 'Array of InventoryMovements model instances',
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
                                        numberBoxes: {
                                            type: 'number'
                                        },
                                        quantity: {
                                            type: 'number'
                                        },
                                        commentEntry: {
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
    async findContainer(
        @param.path.number('id') id: number,
    ): Promise<Object[]> {
        return this.inventoryMovementsService.findContainer(id);
    }

    @patch('/inventory-movements/purchase-orders')
    @response(200, {
        description: 'Array of InventoryMovements model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string'
                        }
                    }
                },
            },
        },
    })
    async updateProducts(
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
                                                    quantity: {
                                                        type: 'number'
                                                    },
                                                    commentEntry: {
                                                        type: 'string'
                                                    },
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
        data: {purchaseOrders: {id: number, products: {id: number, quantity: number, commentEntry: string}[]}[]},
    ): Promise<Object> {
        return this.inventoryMovementsService.updateProducts(data);
    }

    @get('/inventory-movements/products')
    @response(200, {
        description: 'Array of Product model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
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
                                    numberBoxes: {
                                        type: 'number'
                                    },
                                    projectId: {
                                        type: 'string'
                                    },
                                }
                            }
                        }
                    }
                },
            },
        },
    })
    async getProducts(
        @param.filter(QuotationProducts) filter?: Filter<QuotationProducts>,
    ): Promise<Object> {
        return this.inventoryMovementsService.getProducts(filter);
    }

    // @get('/inventory-movements/count')
    // @response(200, {
    //     description: 'InventoryMovements model count',
    //     content: {'application/json': {schema: CountSchema}},
    // })
    // async count(
    //     @param.where(InventoryMovements) where?: Where<InventoryMovements>,
    // ): Promise<Count> {
    //     return this.inventoryMovementsRepository.count(where);
    // }

    // @get('/inventory-movements')
    // @response(200, {
    //     description: 'Array of InventoryMovements model instances',
    //     content: {
    //         'application/json': {
    //             schema: {
    //                 type: 'array',
    //                 items: getModelSchemaRef(InventoryMovements, {includeRelations: false}),
    //             },
    //         },
    //     },
    // })
    // async find(
    //     @param.filter(InventoryMovements) filter?: Filter<InventoryMovements>,
    // ): Promise<InventoryMovements[]> {
    //     return this.inventoryMovementsRepository.find(filter);
    // }

    // @get('/inventory-movements/{id}')
    // @response(200, {
    //     description: 'InventoryMovements model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(InventoryMovements, {includeRelations: false}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(InventoryMovements, {exclude: 'where'}) filter?: FilterExcludingWhere<InventoryMovements>
    // ): Promise<InventoryMovements> {
    //     return this.inventoryMovementsRepository.findById(id, filter);
    // }

    // @patch('/inventory-movements/{id}')
    // @response(204, {
    //     description: 'InventoryMovements PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(InventoryMovements, {partial: true}),
    //             },
    //         },
    //     })
    //     inventoryMovements: InventoryMovements,
    // ): Promise<void> {
    //     await this.inventoryMovementsRepository.updateById(id, inventoryMovements);
    // }

    // @del('/inventory-movements/{id}')
    // @response(204, {
    //     description: 'InventoryMovements DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.inventoryMovementsRepository.deleteById(id);
    // }
}
