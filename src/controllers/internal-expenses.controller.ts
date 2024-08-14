import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
} from '@loopback/repository';
import {
    del,
    get,
    getModelSchemaRef,
    param,
    patch,
    post,
    put,
    requestBody,
    response,
} from '@loopback/rest';
import {InternalExpenses} from '../models';
import {InternalExpensesRepository} from '../repositories';

export class InternalExpensesController {
    constructor(
        @repository(InternalExpensesRepository)
        public internalExpensesRepository: InternalExpensesRepository,
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
        return this.internalExpensesRepository.create(internalExpenses);
    }

    @get('/internal-expenses/count')
    @response(200, {
        description: 'InternalExpenses model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(InternalExpenses) where?: Where<InternalExpenses>,
    ): Promise<Count> {
        return this.internalExpensesRepository.count(where);
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
        return this.internalExpensesRepository.find(filter);
    }

    @patch('/internal-expenses')
    @response(200, {
        description: 'InternalExpenses PATCH success count',
        content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(InternalExpenses, {partial: true}),
                },
            },
        })
        internalExpenses: InternalExpenses,
        @param.where(InternalExpenses) where?: Where<InternalExpenses>,
    ): Promise<Count> {
        return this.internalExpensesRepository.updateAll(internalExpenses, where);
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
        return this.internalExpensesRepository.findById(id, filter);
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
        await this.internalExpensesRepository.updateById(id, internalExpenses);
    }

    @put('/internal-expenses/{id}')
    @response(204, {
        description: 'InternalExpenses PUT success',
    })
    async replaceById(
        @param.path.number('id') id: number,
        @requestBody() internalExpenses: InternalExpenses,
    ): Promise<void> {
        await this.internalExpensesRepository.replaceById(id, internalExpenses);
    }

    @del('/internal-expenses/{id}')
    @response(204, {
        description: 'InternalExpenses DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.internalExpensesRepository.deleteById(id);
    }
}
