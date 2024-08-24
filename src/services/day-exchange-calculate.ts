import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {DayExchangeRateRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DayExchangeCalculateService {

    constructor(
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,
    ) { }


    async getdayExchangeRateEuroTo() {
        const dayExchangeRate = await this.dayExchangeRateRepository.findOne();
        if (dayExchangeRate) {
            const {euroToDolar, euroToPeso} = dayExchangeRate;
            return {USD: euroToDolar, MXN: euroToPeso}
        } else {
            return {USD: 1.074, MXN: 19.28}
        }
    }
    async getdayExchangeRateMxnTo() {
        const dayExchangeRate = await this.dayExchangeRateRepository.findOne();
        if (dayExchangeRate) {
            const {mxnToDolar, mxnToEuro} = dayExchangeRate;
            return {USD: mxnToDolar, EUR: mxnToEuro}
        } else {
            return {USD: 0.052, EUR: 0.047}
        }
    }

    async getdayExchangeRateDollarTo() {
        const dayExchangeRate = await this.dayExchangeRateRepository.findOne();
        if (dayExchangeRate) {
            const {dolarToEuro, dolarToPeso} = dayExchangeRate;
            return {EUR: dolarToEuro, MXN: dolarToPeso}
        } else {
            return {EUR: 0.89, MXN: 19.11}
        }
    }
}
