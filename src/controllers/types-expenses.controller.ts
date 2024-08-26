import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Filter
} from '@loopback/repository';
import {
    get,
    getModelSchemaRef,
    param,
    response
} from '@loopback/rest';
import {TypesExpenses} from '../models';
import {TypesExpensesService} from '../services';

@authenticate('jwt')
export class TypesExpensesController {
    constructor(
        @service()
        public typesExpensesService: TypesExpensesService
    ) { }

    // @post('/types-expenses')
    // @response(200, {
    //     description: 'TypesExpenses model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(TypesExpenses)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(TypesExpenses, {
    //                     title: 'NewTypesExpenses',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     typesExpenses: Omit<TypesExpenses, 'id'>,
    // ): Promise<TypesExpenses> {
    //     return this.typesExpensesRepository.create(typesExpenses);
    // }

    @get('/types-expenses')
    @response(200, {
        description: 'Array of TypesExpenses model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(TypesExpenses, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(TypesExpenses) filter?: Filter<TypesExpenses>,
    ): Promise<TypesExpenses[]> {
        return this.typesExpensesService.find(filter);
    }


    // @get('/types-expenses/{id}')
    // @response(200, {
    //     description: 'TypesExpenses model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(TypesExpenses, {includeRelations: false}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(TypesExpenses, {exclude: 'where'}) filter?: FilterExcludingWhere<TypesExpenses>
    // ): Promise<TypesExpenses> {
    //     return this.typesExpensesRepository.findById(id, filter);
    // }

    // @patch('/types-expenses/{id}')
    // @response(204, {
    //     description: 'TypesExpenses PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(TypesExpenses, {partial: true}),
    //             },
    //         },
    //     })
    //     typesExpenses: TypesExpenses,
    // ): Promise<void> {
    //     await this.typesExpensesRepository.updateById(id, typesExpenses);
    // }

    // @del('/types-expenses/{id}')
    // @response(204, {
    //     description: 'TypesExpenses DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.typesExpensesRepository.deleteById(id);
    // }
}
