import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {DayExchangeRateRepository, QuotationRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DayExchancheCalculateToService {
    constructor(
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,

        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
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

    async getdayExchangeRatAll() {
        const {EUR: dolarToEuro, MXN: dolarToPeso} = await this.getdayExchangeRateDollarTo();
        const {USD: mxnToDolar, EUR: mxnToEuro} = await this.getdayExchangeRateMxnTo();
        const {USD: euroToDolar, MXN: euroToPeso} = await this.getdayExchangeRateEuroTo();
        return {
            dolarToEuro,
            dolarToPeso,
            mxnToDolar,
            mxnToEuro,
            euroToDolar,
            euroToPeso
        }
    }

    async getdayExchangeRateEuroToQuotation(quotationId: number) {
        const {euroToDolar, euroToPeso} = await this.quotationRepository.findById(quotationId, {fields: ['id', 'dolarToEuro', 'dolarToPeso', 'mxnToDolar', 'mxnToEuro', 'euroToDolar', 'euroToPeso']});
        return {USD: euroToDolar, MXN: euroToPeso}
    }

    async getdayExchangeRateMxnToQuotation(quotationId: number) {
        const {mxnToDolar, mxnToEuro} = await this.quotationRepository.findById(quotationId, {fields: ['id', 'dolarToEuro', 'dolarToPeso', 'mxnToDolar', 'mxnToEuro', 'euroToDolar', 'euroToPeso']});
        return {USD: mxnToDolar, EUR: mxnToEuro}
    }

    async getdayExchangeRateDollarToQuotation(quotationId: number) {
        const {dolarToEuro, dolarToPeso} = await this.quotationRepository.findById(quotationId, {fields: ['id', 'dolarToEuro', 'dolarToPeso', 'mxnToDolar', 'mxnToEuro', 'euroToDolar', 'euroToPeso']});
        return {EUR: dolarToEuro, MXN: dolarToPeso}
    }
}
