import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {schemaCreateInternalExpenses} from '../joi.validation.ts/internal-expenses';
import {ResponseServiceBindings} from '../keys';
import {InternalExpenses} from '../models';
import {BranchRepository, InternalExpensesRepository, TypesExpensesRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class InternalExpensesService {
    constructor(
        @repository(InternalExpensesRepository)
        public internalExpensesRepository: InternalExpensesRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(TypesExpensesRepository)
        public typesExpensesRepository: TypesExpensesRepository,
        @repository(BranchRepository)
        public branchRepository: BranchRepository
    ) { }

    async create(internalExpenses: Omit<InternalExpenses, 'id'>,) {
        const {typesExpensesId, brandId} = internalExpenses;
        await this.findTypeExpeneseById(typesExpensesId);
        await this.findBranchById(typesExpensesId);
        try {
            await this.validateBodyInternalExpenses(internalExpenses);
            return this.internalExpensesRepository.create(internalExpenses);
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
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

    async findTypeExpeneseById(id: number) {
        const typesExpenses = await this.typesExpensesRepository.findOne({where: {id}});
        if (!typesExpenses)
            throw this.responseService.notFound('La Clasificación del gasto no existe.')
    }

    async findBranchById(id: number) {
        const brand = await this.branchRepository.findOne({where: {id}});
        if (!brand)
            throw this.responseService.notFound('La sucursal no existe.')
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
