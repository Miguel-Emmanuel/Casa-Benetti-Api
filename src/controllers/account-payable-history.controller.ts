import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere
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
import {AccountPayableHistoryService} from '../services';

@authenticate('jwt')
export class AccountPayableHistoryController {
    constructor(
        @service()
        public accountPayableHistoryService: AccountPayableHistoryService
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
        return this.accountPayableHistoryService.create(accountPayableHistory);
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
        return this.accountPayableHistoryService.find(filter);
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
        return this.accountPayableHistoryService.findById(id, filter);
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
        await this.accountPayableHistoryService.updateById(id, accountPayableHistory);
    }

    @del('/account-payable-histories/{id}')
    @response(204, {
        description: 'AccountPayableHistory DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.accountPayableHistoryService.deleteById(id);
    }
}
