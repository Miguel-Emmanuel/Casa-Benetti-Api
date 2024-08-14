import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {schemaCreateInternalExpenses} from '../joi.validation.ts/internal-expenses';
import {ResponseServiceBindings} from '../keys';
import {InternalExpenses} from '../models';
import {InternalExpensesRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class InternalExpensesService {
    constructor(
        @repository(InternalExpensesRepository)
        public internalExpensesRepository: InternalExpensesRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
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

    async validateBodyInternalExpenses(internalExpenses: Omit<InternalExpenses, 'id'>,) {
        try {
            await schemaCreateInternalExpenses.validateAsync(internalExpenses);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }
}
