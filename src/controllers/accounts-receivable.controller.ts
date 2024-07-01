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
    get,
    getModelSchemaRef,
    param,
    patch,
    requestBody,
    response
} from '@loopback/rest';
import {AccountsReceivable} from '../models';
import {AccountsReceivableService} from '../services';

@authenticate('jwt')
export class AccountsReceivableController {
    constructor(
        @service()
        public accountsReceivableService: AccountsReceivableService
    ) { }

    // @post('/accounts-receivables')
    // @response(200, {
    //     description: 'AccountsReceivable model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(AccountsReceivable)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(AccountsReceivable, {
    //                     title: 'NewAccountsReceivable',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     accountsReceivable: Omit<AccountsReceivable, 'id'>,
    // ): Promise<AccountsReceivable> {
    //     return this.accountsReceivableService.create(accountsReceivable);
    // }

    @get('/accounts-receivables/count')
    @response(200, {
        description: 'AccountsReceivable model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(AccountsReceivable) where?: Where<AccountsReceivable>,
    ): Promise<Count> {
        return this.accountsReceivableService.count(where);
    }

    @get('/accounts-receivables')
    @response(200, {
        description: 'Array of AccountsReceivable model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(AccountsReceivable),
                },
            },
        },
    })
    async find(
        @param.filter(AccountsReceivable) filter?: Filter<AccountsReceivable>,
    ): Promise<AccountsReceivable[]> {
        return this.accountsReceivableService.find(filter);
    }

    @get('/accounts-receivables/{id}')
    @response(200, {
        description: 'AccountsReceivable model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(AccountsReceivable,),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(AccountsReceivable, {exclude: 'where'}) filter?: FilterExcludingWhere<AccountsReceivable>
    ): Promise<AccountsReceivable> {
        return this.accountsReceivableService.findById(id, filter);
    }

    @patch('/accounts-receivables/{id}')
    @response(204, {
        description: 'AccountsReceivable PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(AccountsReceivable, {partial: true}),
                },
            },
        })
        accountsReceivable: AccountsReceivable,
    ): Promise<void> {
        await this.accountsReceivableService.updateById(id, accountsReceivable);
    }


    // @del('/accounts-receivables/{id}')
    // @response(204, {
    //     description: 'AccountsReceivable DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.accountsReceivableService.deleteById(id);
    // }
}
