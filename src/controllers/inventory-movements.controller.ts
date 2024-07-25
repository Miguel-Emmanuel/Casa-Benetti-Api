import {service} from '@loopback/core';
import {
    repository
} from '@loopback/repository';
import {
    getModelSchemaRef,
    post,
    requestBody,
    response
} from '@loopback/rest';
import {EntryDataI, IssueDataI} from '../interface';
import {InventoryMovements} from '../models';
import {InventoryMovementsRepository} from '../repositories';
import {InventoryMovementsService} from '../services';

// @authenticate('jwt')
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
                            containerNumber: {
                                type: 'string',
                                nullable: true
                            },
                            collectionNumber: {
                                type: 'string',
                                nullable: true
                            },
                            products: {
                                type: 'array',
                                nullable: true,
                                items: {
                                    type: 'object',
                                    properties: {
                                        quotationProductsId: {
                                            type: 'number'
                                        }
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
                                type: 'number',
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
    ): Promise<any> {
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
                            containerNumber: {
                                type: 'string',
                                nullable: true
                            },
                            destinationBranchId: {
                                type: 'number',
                                nullable: true
                            },
                        }
                    }
                },
            },
        })
        data: IssueDataI,
    ): Promise<any> {
        return this.inventoryMovementsService.issue(data);
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
    //                 items: getModelSchemaRef(InventoryMovements, {includeRelations: true}),
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
    //             schema: getModelSchemaRef(InventoryMovements, {includeRelations: true}),
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
