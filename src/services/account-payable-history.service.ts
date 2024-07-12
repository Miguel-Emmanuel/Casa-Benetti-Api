import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {AccountPayableHistory} from '../models';
import {AccountPayableHistoryRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountPayableHistoryService {
    constructor(
        @repository(AccountPayableHistoryRepository)
        public accountPayableHistoryRepository: AccountPayableHistoryRepository,
    ) { }


    async create(accountPayableHistory: Omit<AccountPayableHistory, 'id'>,) {
        return this.accountPayableHistoryRepository.create(accountPayableHistory);
    }

    async find(filter?: Filter<AccountPayableHistory>,) {
        return this.accountPayableHistoryRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AccountPayableHistory>) {
        return this.accountPayableHistoryRepository.findById(id, filter);
    }
    async updateById(id: number, accountPayableHistory: AccountPayableHistory,) {
        await this.accountPayableHistoryRepository.updateById(id, accountPayableHistory);
    }
    async deleteById(id: number,) {
        await this.accountPayableHistoryRepository.deleteById(id);
    }
}
