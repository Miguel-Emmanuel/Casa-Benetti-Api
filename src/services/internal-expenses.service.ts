import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {InternalExpenses} from '../models';
import {InternalExpensesRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class InternalExpensesService {
    constructor(
        @repository(InternalExpensesRepository)
        public internalExpensesRepository: InternalExpensesRepository,
    ) { }


    async create(internalExpenses: Omit<InternalExpenses, 'id'>,) {
        return this.internalExpensesRepository.create(internalExpenses);
    }

    async find(filter?: Filter<InternalExpenses>,) {
        return this.internalExpensesRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<InternalExpenses>) {
        return this.internalExpensesRepository.findById(id, filter);
    }

    async updateById(id: number, internalExpenses: InternalExpenses,) {
        await this.internalExpensesRepository.updateById(id, internalExpenses);
    }
}
