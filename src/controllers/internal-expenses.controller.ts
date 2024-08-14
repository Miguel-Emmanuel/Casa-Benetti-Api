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
import {InternalExpenses} from '../models';
import {InternalExpensesService} from '../services';

export class InternalExpensesController {
    constructor(
        @service()
        public internalExpensesService: InternalExpensesService
    ) { }

    @post('/internal-expenses')
    @response(200, {
        description: 'InternalExpenses model instance',
        content: {'application/json': {schema: getModelSchemaRef(InternalExpenses)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(InternalExpenses, {
                        title: 'NewInternalExpenses',
                        exclude: ['id'],
                    }),
                },
            },
        })
        internalExpenses: Omit<InternalExpenses, 'id'>,
    ): Promise<InternalExpenses> {
        return this.internalExpensesService.create(internalExpenses);
    }

    @get('/internal-expenses')
    @response(200, {
        description: 'Array of InternalExpenses model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(InternalExpenses, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(InternalExpenses) filter?: Filter<InternalExpenses>,
    ): Promise<InternalExpenses[]> {
        return this.internalExpensesService.find(filter);
    }

    @get('/internal-expenses/{id}')
    @response(200, {
        description: 'InternalExpenses model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(InternalExpenses, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(InternalExpenses, {exclude: 'where'}) filter?: FilterExcludingWhere<InternalExpenses>
    ): Promise<InternalExpenses> {
        return this.internalExpensesService.findById(id, filter);
    }

    @patch('/internal-expenses/{id}')
    @response(204, {
        description: 'InternalExpenses PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(InternalExpenses, {partial: true}),
                },
            },
        })
        internalExpenses: InternalExpenses,
    ): Promise<void> {
        await this.internalExpensesService.updateById(id, internalExpenses);
    }

    // @del('/internal-expenses/{id}')
    // @response(204, {
    //     description: 'InternalExpenses DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.internalExpensesRepository.deleteById(id);
    // }
}
