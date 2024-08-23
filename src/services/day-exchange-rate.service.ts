import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {DayExchangeRate} from '../models';
import {DayExchangeRateRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DayExchangeRateService {
    constructor(
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,
    ) { }

    async create(dayExchangeRate: Omit<DayExchangeRate, 'id'>,) {
        return this.dayExchangeRateRepository.create(dayExchangeRate);
    }

    async find(filter?: Filter<DayExchangeRate>,) {
        return this.dayExchangeRateRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<DayExchangeRate>) {
        return this.dayExchangeRateRepository.findById(id, filter);
    }

    async updateById(id: number, dayExchangeRate: DayExchangeRate,) {
        await this.dayExchangeRateRepository.updateById(id, dayExchangeRate);
    }

}
