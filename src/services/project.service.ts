import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
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

        return project;
    }

    async createAdvancePaymentRecord(quotationId: number) {
        const quotation = await this.findQuotationById(quotationId);
        const {proofPaymentQuotations, exchangeRateQuotation, percentageIvaEUR} = quotation;
        for (let index = 0; index < proofPaymentQuotations?.length; index++) {
            const {paymentDate, paymentType, advanceCustomer, exchangeRateAmount, exchangeRate, conversionAdvance} = proofPaymentQuotations[index];
            const body = {
                paymentDate,
                paymentMethod: paymentType,
                amountPaid: advanceCustomer,
                paymentCurrency: exchangeRate,
                parity: exchangeRateAmount,
                percentageIva: percentageIvaEUR,
                currencyApply: exchangeRateQuotation,
                conversionAmountPaid: conversionAdvance,
                subtotalAmountPaid: 40,
                paymentPercentage: 20,

            }

        }
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}, include: [{relation: 'proofPaymentQuotations'}]});
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation
    }

}
