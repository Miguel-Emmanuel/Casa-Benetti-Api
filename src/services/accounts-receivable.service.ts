import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {AccountsReceivable} from '../models';
import {AccountsReceivableRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountsReceivableService {
    constructor(
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
    ) { }

    async count(where?: Where<AccountsReceivable>,) {
        return this.accountsReceivableRepository.count(where);
    }
    async find(filter?: Filter<AccountsReceivable>,) {
        return this.accountsReceivableRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AccountsReceivable>) {
        return this.accountsReceivableRepository.findById(id, filter);
    }

    async updateById(id: number, accountsReceivable: AccountsReceivable,) {
        await this.accountsReceivableRepository.updateById(id, accountsReceivable);
    }
}
