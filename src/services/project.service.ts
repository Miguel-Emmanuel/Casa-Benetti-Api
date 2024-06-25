import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
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
            const conversionAmountPaid = advanceCustomer / exchangeRateAmount;
            const body = {
                paymentDate,
                paymentMethod: paymentType,
                amountPaid: advanceCustomer,
                paymentCurrency: exchangeRate,
                parity: exchangeRateAmount,
                percentageIva: percentageIva,
                currencyApply: exchangeRateQuotation,
                conversionAmountPaid,
                subtotalAmountPaid: (conversionAmountPaid / ((percentageIva / 100) + 1)),
                paymentPercentage: this.calculatePercentage(exchangeRateQuotation, quotation, conversionAmountPaid),
                projectId

            }
            await this.advancePaymentRecordRepository.create(body);
        }
    }

    calculatePercentage(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation, conversionAmountPaid: number) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                const subtotalEUR = quotation.totalEUR - conversionAmountPaid;
                const differenceEUR = subtotalEUR / quotation.totalEUR
                return differenceEUR * 100;
                break;
            case ExchangeRateQuotationE.MXN:
                const subtotalMXN = quotation.totalMXN - conversionAmountPaid;
                const differenceMXN = subtotalMXN / quotation.totalMXN
                return differenceMXN * 100;

                break;
            case ExchangeRateQuotationE.USD:
                const subtotalUSD = quotation.totalUSD - conversionAmountPaid;
                const differenceUSD = subtotalUSD / quotation.totalUSD
                return differenceUSD * 100;

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
