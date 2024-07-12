import {authenticate} from '@loopback/authentication';
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
    requestBody,
    response
} from '@loopback/rest';
import {AccountPayableHistory} from '../models';
import {AccountPayableHistoryRepository} from '../repositories';

@authenticate('jwt')
export class AccountPayableHistoryController {
    constructor(
        @repository(AccountPayableHistoryRepository)
        public accountPayableHistoryRepository: AccountPayableHistoryRepository,
    ) { }

    @post('/account-payable-histories')
    @response(200, {
        description: 'AccountPayableHistory model instance',
        content: {'application/json': {schema: getModelSchemaRef(AccountPayableHistory)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AccountPayableHistory, {
                        title: 'NewAccountPayableHistory',
                        exclude: ['id'],
                    }),
                },
            },
        })
        accountPayableHistory: Omit<AccountPayableHistory, 'id'>,
    ): Promise<AccountPayableHistory> {
        return this.accountPayableHistoryRepository.create(accountPayableHistory);
    }

    @get('/account-payable-histories/count')
    @response(200, {
        description: 'AccountPayableHistory model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(AccountPayableHistory) where?: Where<AccountPayableHistory>,
    ): Promise<Count> {
        return this.accountPayableHistoryRepository.count(where);
    }

    @get('/account-payable-histories')
    @response(200, {
        description: 'Array of AccountPayableHistory model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(AccountPayableHistory, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(AccountPayableHistory) filter?: Filter<AccountPayableHistory>,
    ): Promise<AccountPayableHistory[]> {
        return this.accountPayableHistoryRepository.find(filter);
    }

    @get('/account-payable-histories/{id}')
    @response(200, {
        description: 'AccountPayableHistory model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(AccountPayableHistory, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(AccountPayableHistory, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountPayableHistory>
    ): Promise<AccountPayableHistory> {
        return this.accountPayableHistoryRepository.findById(id, filter);
    }

    @patch('/account-payable-histories/{id}')
    @response(204, {
        description: 'AccountPayableHistory PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AccountPayableHistory, {partial: true}),
                },
            },
        })
        accountPayableHistory: AccountPayableHistory,
    ): Promise<void> {
        await this.accountPayableHistoryRepository.updateById(id, accountPayableHistory);
    }

    @del('/account-payable-histories/{id}')
    @response(204, {
        description: 'AccountPayableHistory DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.accountPayableHistoryRepository.deleteById(id);
    }
}
