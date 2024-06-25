import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import BigNumber from 'bignumber.js';
import {AdvancePaymentTypeE, ExchangeRateQuotationE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {AdvancePaymentRecordRepository, CommissionPaymentRecordRepository, ProjectRepository, QuotationDesignerRepository, QuotationProjectManagerRepository, QuotationRepository} from '../repositories';
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
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProjectManagerRepository)
        public quotationProjectManagerRepository: QuotationProjectManagerRepository,
        @repository(QuotationDesignerRepository)
        public quotationDesignerRepository: QuotationDesignerRepository
    ) { }

    async create(body: {quotationId: number}) {
        const project = await this.projectRepository.create(body);
        const {quotationId} = body;
        const quotation = await this.findQuotationById(quotationId);
        await this.createAdvancePaymentRecord(quotation, project.id)
        await this.createCommissionPaymentRecord(quotation, project.id, quotationId)
        return project;
    }

    async createCommissionPaymentRecord(quotation: Quotation, projectId: number, quotationId: number) {
        const {isArchitect, exchangeRateQuotation, isReferencedCustomer, isProjectManager, isDesigner} = quotation;
        console.log('isArchitect: ', isArchitect)
        //Arquitecto
        if (isArchitect === true) {
            const {architectName, commissionPercentageArchitect} = quotation;
            const body = {
                userName: architectName,
                projectId,
                commissionPercentage: commissionPercentageArchitect,
                commissionAmount: this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentageArchitect),
                projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                type: AdvancePaymentTypeE.ARQUITECTO
            }
            await this.commissionPaymentRecordRepository.create(body);
        }

        //Cliente referenciado
        if (isReferencedCustomer === true) {
            const {referenceCustomerId, commissionPercentagereferencedCustomer} = quotation;
            const body = {
                userId: referenceCustomerId,
                projectId,
                commissionPercentage: commissionPercentagereferencedCustomer,
                commissionAmount: this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentagereferencedCustomer),
                projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                type: AdvancePaymentTypeE.CLIENTE_REFERENCIADO
            }
            await this.commissionPaymentRecordRepository.create(body);
        }

        //Project managers
        if (isProjectManager === true) {
            const quotationProjectManagers = await this.quotationProjectManagerRepository.find({where: {quotationId}});
            for (const iterator of quotationProjectManagers) {
                const {commissionPercentageProjectManager, userId} = iterator;
                const body = {
                    userId: userId,
                    projectId,
                    commissionPercentage: commissionPercentageProjectManager,
                    commissionAmount: this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentageProjectManager),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.PROJECT_MANAGER
                }
                await this.commissionPaymentRecordRepository.create(body);
            }
        }

        //Proyectistas
        if (isDesigner === true) {
            const QuotationDesigners = await this.quotationDesignerRepository.find({where: {quotationId}});
            for (const iterator of QuotationDesigners) {
                const {commissionPercentageDesigner, userId} = iterator;
                const body = {
                    userId: userId,
                    projectId,
                    commissionPercentage: commissionPercentageDesigner,
                    commissionAmount: this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentageDesigner),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.PROYECTISTA
                }
                await this.commissionPaymentRecordRepository.create(body);
            }
        }

    }

    getTotalQuotation(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                return quotation.totalEUR;
                break;
            case ExchangeRateQuotationE.MXN:
                return quotation.totalMXN;

                break;
            case ExchangeRateQuotationE.USD:
                return quotation.totalUSD;
                break;
        }
    }

    calculateCommissionAmount(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation, commissionPercentage: number) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                const commisionEUR = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalEUR, commisionEUR)
                break;
            case ExchangeRateQuotationE.MXN:
                const commisionMXN = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalMXN, commisionMXN)

                break;
            case ExchangeRateQuotationE.USD:
                const commisionUSD = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalUSD, commisionUSD)

                break;

            default:
                break;
        }
    }

    async createAdvancePaymentRecord(quotation: Quotation, projectId: number) {
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
