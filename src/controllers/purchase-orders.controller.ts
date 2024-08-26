import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    Where
} from '@loopback/repository';
import {
    del,
    get,
    getModelSchemaRef,
    param,
    patch,
    requestBody,
    response
} from '@loopback/rest';
import {PurchaseOrdersStatus} from '../enums';
import {PurchaseOrders} from '../models';
import {PurchaseOrdersService} from '../services';

@authenticate('jwt')
export class PurchaseOrdersController {
    constructor(
        @service()
        public purchaseOrdersService: PurchaseOrdersService
    ) { }

    // @post('/purchase-orders')
    // @response(200, {
    //     description: 'PurchaseOrders model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(PurchaseOrders)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(PurchaseOrders, {
    //                     title: 'NewPurchaseOrders',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     purchaseOrders: Omit<PurchaseOrders, 'id'>,
    // ): Promise<PurchaseOrders> {
    //     return this.purchaseOrdersService.create(purchaseOrders);
    // }

    @get('/purchase-orders/count')
    @response(200, {
        description: 'PurchaseOrders model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(PurchaseOrders) where?: Where<PurchaseOrders>,
    ): Promise<Count> {
        return this.purchaseOrdersService.count(where);
    }

    @get('/purchase-orders')
    @response(200, {
        description: 'Array of PurchaseOrders model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(PurchaseOrders, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(PurchaseOrders) filter?: Filter<PurchaseOrders>,
    ): Promise<Object[]> {
        return this.purchaseOrdersService.find(filter);
    }

    @get('/purchase-orders/{id}')
    @response(200, {
        description: 'PurchaseOrders model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(PurchaseOrders, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(PurchaseOrders, {exclude: 'where'}) filter?: FilterExcludingWhere<PurchaseOrders>
    ): Promise<Object> {
        return this.purchaseOrdersService.findById(id, filter);
    }

    @get('/purchase-orders/{id}/pdf')
    async getAccountStatement(
        @param.path.number('id') id: number,
    ): Promise<any> {
        return this.purchaseOrdersService.downloadPurchaseOrder(id);
    }

    @patch('/purchase-orders/{id}')
    @response(204, {
        description: 'PurchaseOrders PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(PurchaseOrders, {partial: true}),
                },
            },
        })
        purchaseOrders: PurchaseOrders,
    ): Promise<void> {
        await this.purchaseOrdersService.updateById(id, purchaseOrders);
    }

    @patch('/purchase-orders/{id}/status')
    @response(204, {
        description: 'purchase order PATCH success',
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
    async updateStatusById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            status: {
                                type: 'string'
                            }
                        }
                    }
                },
            },
        })
        data: {status: PurchaseOrdersStatus},
    ): Promise<void> {
        await this.purchaseOrdersService.updateStatusById(id, data);
    }

    @del('/purchase-orders/{id}')
    @response(204, {
        description: 'PurchaseOrders DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.purchaseOrdersService.deleteById(id);
    }

    @get('/purchase-orders/earrings-collect')
    @response(200, {
        description: 'Array of purchase-orders model instances',
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
                            proformaId: {
                                type: 'string'
                            },
                            provider: {
                                type: 'string'
                            },
                            brand: {
                                type: 'string'
                            },
                            quantity: {
                                type: 'string'
                            },
                            productionEndDate: {
                                type: 'string',
                                format: 'date-time'
                            },
                        }
                    },
                },
            },
        },
    })
    async earringsCollect(
    ): Promise<Object[]> {
        return this.purchaseOrdersService.earringsCollect();
    }

    @patch('/purchase-orders/{id}/production-real-end-date')
    @response(204, {
        description: 'purchase order PATCH success',
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
    async saveProductionRealEndDate(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            productionRealEndDate: {
                                type: 'string',
                                format: 'date-time'
                            }
                        }
                    }
                },
            },
        })
        data: {productionRealEndDate: string},
    ): Promise<void> {
        await this.purchaseOrdersService.saveProductionRealEndDate(id, data);
    }
}
