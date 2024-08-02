import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere
} from '@loopback/repository';
import {
    get,
    param,
    patch,
    requestBody,
    response
} from '@loopback/rest';
import {DeliveryRequestStatusE} from '../enums';
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

    @get('/delivery-requests/logistic')
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
    async findLogistic(
        @param.filter(DeliveryRequest) filter?: Filter<DeliveryRequest>,
    ): Promise<Object[]> {
        return this.deliveryRequestService.findLogistic(filter);
    }

    @get('/delivery-requests/{id}')
    @response(200, {
        description: 'Array of DeliveryRequest model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number'
                        },
                        deliveryDay: {
                            type: 'string',
                            format: 'date-time'
                        },
                        status: {
                            type: 'string'
                        },
                        comment: {
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
                                                SKU: {
                                                    type: 'string'
                                                },
                                                image: {
                                                    type: 'string'
                                                },
                                                description: {
                                                    type: 'string'
                                                },
                                                isSelected: {
                                                    type: 'boolean'
                                                },
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
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(DeliveryRequest, {exclude: 'where'}) filter?: FilterExcludingWhere<DeliveryRequest>
    ): Promise<Object> {
        return this.deliveryRequestService.findById(id, filter);
    }

    @get('/delivery-requests/{id}/logistic')
    @response(200, {
        description: 'Array of DeliveryRequest model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number'
                        },
                        customerName: {
                            type: 'string'
                        },
                        customerAddress: {
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
                        comment: {
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
                                                SKU: {
                                                    type: 'string'
                                                },
                                                image: {
                                                    type: 'string'
                                                },
                                                description: {
                                                    type: 'string'
                                                },
                                                isSelected: {
                                                    type: 'boolean'
                                                },
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
    })
    async findByIdLogistic(
        @param.path.number('id') id: number,
        @param.filter(DeliveryRequest, {exclude: 'where'}) filter?: FilterExcludingWhere<DeliveryRequest>
    ): Promise<Object> {
        return this.deliveryRequestService.findByIdLogistic(id, filter);
    }

    @patch('/delivery-requests/{id}/status')
    @response(204, {
        description: 'DeliveryRequest order PATCH success PROGRAMADA and RECHAZADA',
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
    async updateDeliveryRequest(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string'
                            },
                            reason: {
                                type: 'string',
                                nullable: true
                            }
                        }
                    }
                },
            },
        })
        data: {status: DeliveryRequestStatusE, reason?: string},
    ): Promise<void> {
        await this.deliveryRequestService.updateDeliveryRequest(id, data);
    }

    @patch('/delivery-requests/{id}')
    @response(200, {
        description: 'Project DeliveryRequest instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string'
                        }
                    }
                }
            },
        },
    })
    async postDeliveryRequest(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            deliveryDay: {
                                type: 'string',
                                format: 'date-time'
                            },
                            comment: {
                                type: 'string',
                                nullable: true
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
                                                    isSelected: {
                                                        type: 'boolean'
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
        data: {deliveryDay: string, comment: string, purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]}
    ): Promise<any> {
        return this.deliveryRequestService.patch(id, data);
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
