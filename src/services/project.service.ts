import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import BigNumber from 'bignumber.js';
import {ExchangeRateQuotationE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {AdvancePaymentRecordRepository, ProjectRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProjectService {
    constructor(
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(AdvancePaymentRecordRepository)
        public advancePaymentRecordRepository: AdvancePaymentRecordRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }

    async create(body: {quotationId: number}) {
        const project = await this.projectRepository.create(body);
        const {quotationId} = body;
        await this.createAdvancePaymentRecord(quotationId, project.id)
        return project;
    }

    async createAdvancePaymentRecord(quotationId: number, projectId: number) {
        const quotation = await this.findQuotationById(quotationId);
        const {proofPaymentQuotations, exchangeRateQuotation, percentageIva, } = quotation;
        for (let index = 0; index < proofPaymentQuotations?.length; index++) {
            const {paymentDate, paymentType, advanceCustomer, exchangeRateAmount, exchangeRate, conversionAdvance} = proofPaymentQuotations[index];
            const conversionAmountPaid = this.bigNumberDividedBy(advanceCustomer, exchangeRateAmount);
            const body = {
                paymentDate,
                paymentMethod: paymentType,
                amountPaid: advanceCustomer,
                paymentCurrency: exchangeRate,
                parity: exchangeRateAmount,
                percentageIva: percentageIva,
                currencyApply: exchangeRateQuotation,
                conversionAmountPaid,
                subtotalAmountPaid: this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1)),
                paymentPercentage: this.calculatePercentage(exchangeRateQuotation, quotation, conversionAmountPaid),
                projectId

            }
            await this.advancePaymentRecordRepository.create(body);
        }
    }

    bigNumberDividedBy(price: number, value: number): number {
        return Number(new BigNumber(price).dividedBy(new BigNumber(value)));
    }

    bigNumberMultipliedBy(price: number, value: number): number {
        return Number(new BigNumber(price).multipliedBy(new BigNumber(value)));
    }


    calculatePercentage(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation, conversionAmountPaid: number) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                const subtotalEUR = quotation.totalEUR - conversionAmountPaid;
                const differenceEUR = this.bigNumberDividedBy(subtotalEUR, quotation.totalEUR)
                return this.bigNumberMultipliedBy(differenceEUR, 100);
                break;
            case ExchangeRateQuotationE.MXN:
                const subtotalMXN = quotation.totalMXN - conversionAmountPaid;
                const differenceMXN = this.bigNumberDividedBy(subtotalMXN, quotation.totalMXN)
                return this.bigNumberMultipliedBy(differenceMXN, 100);

                break;
            case ExchangeRateQuotationE.USD:
                const subtotalUSD = quotation.totalUSD - conversionAmountPaid;
                const differenceUSD = this.bigNumberDividedBy(subtotalUSD, quotation.totalUSD)
                return this.bigNumberMultipliedBy(differenceUSD, 100);

                break;

            default:
                break;
        }
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}, include: [{relation: 'proofPaymentQuotations'}]});
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation
    }

}
