import {authenticate} from '@loopback/authentication';
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
import {InventoryMovements} from '../models';
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
                    schema: getModelSchemaRef(InventoryMovements, {
                        title: 'NewInventoryMovements',
                        exclude: ['id'],
                    }),
                },
            },
        })
        inventoryMovements: Omit<InventoryMovements, 'id'>,
    ): Promise<InventoryMovements> {
        return this.inventoryMovementsService.entry(inventoryMovements);
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
