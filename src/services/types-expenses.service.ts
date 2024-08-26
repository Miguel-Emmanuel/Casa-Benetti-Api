import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {TypesExpenses} from '../models';
import {TypesExpensesRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class TypesExpensesService {
    constructor(
        @repository(TypesExpensesRepository)
        public typesExpensesRepository: TypesExpensesRepository,
    ) { }

    async find(filter?: Filter<TypesExpenses>,) {
        return this.typesExpensesRepository.find(filter);
    }
}
