import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {DayExchangeRate} from '../models';
import {DayExchangeRateRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class DayExchangeRateService {
    constructor(
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }

    async create(dayExchangeRate: Omit<DayExchangeRate, 'id'>,) {
        const dayExchangeRateFind = await this.dayExchangeRateRepository.findOne();
        if (!dayExchangeRateFind) {
            return this.dayExchangeRateRepository.create(dayExchangeRate);
        }
        throw this.responseService.badRequest('Tipo de cambio del dia ya existe, actualiza el existente.')
    }

    async find(filter?: Filter<DayExchangeRate>,) {
        return this.dayExchangeRateRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<DayExchangeRate>) {
        return this.dayExchangeRateRepository.findById(id, filter);
    }

    async updateById(id: number, dayExchangeRate: DayExchangeRate,) {
        await this.dayExchangeRateRepository.updateById(id, {...dayExchangeRate, updatedAt: new Date()});
    }

}
