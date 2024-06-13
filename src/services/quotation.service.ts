import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {StatusQuotationE} from '../enums';
import {CreateQuotation} from '../interface';
import {schemaCreateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class QuotationService {
    constructor(
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProjectManagerRepository)
        public quotationProjectManagerRepository: QuotationProjectManagerRepository,
        @repository(QuotationDesignerRepository)
        public quotationDesignerRepository: QuotationDesignerRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
    ) { }

    async create(data: CreateQuotation) {
        const {client, commissions, id, quotation, products} = data;
        if (id === null) {
            await this.validateBodyQuotation(data);
            const {isArchitect, architectName, commissionPercentageArchitect, isReferencedCustomer, commissionPercentagereferencedCustomer, isProjectManager, isDesigner, projectManagers, designers} = commissions;
            const {subtotal, additionalDiscount, percentageIva, iva, total, percentageAdvance, advance, exchangeRate, balance, } = quotation;
            const bodyQuotation = {
                isArchitect,
                architectName,
                commissionPercentageArchitect,
                isReferencedCustomer,
                commissionPercentagereferencedCustomer,
                isProjectManager,
                isDesigner,
                subtotal,
                additionalDiscount,
                percentageIva,
                iva,
                total,
                percentageAdvance,
                advance,
                exchangeRate,
                exchangeRateAmount: 15,
                balance,
                status: StatusQuotationE.ENPROCESO,
                isDraft: false
            }
            const createQuotation = await this.quotationRepository.create(bodyQuotation);

            for (const element of projectManagers) {
                await this.quotationProjectManagerRepository.create({quotationId: createQuotation.id, userId: element.userId, commissionPercentageProjectManager: element.commissionPercentageProjectManager});
            }
            for (const element of designers) {
                await this.quotationDesignerRepository.create({quotationId: createQuotation.id, userId: element.userId, commissionPercentageDesigner: element.commissionPercentageDesigner});
            }
            for (const element of products) {
                await this.quotationProductsRepository.create({quotationId: createQuotation.id, productId: element.productId, typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal});
            }
        } else {
            await this.findQuotationById(id);
        }

    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}})
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe');
        return quotation;
    }

    async validateBodyQuotation(data: CreateQuotation) {
        try {
            await schemaCreateQuotition.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async count(where?: Where<Quotation>,) {
        return this.quotationRepository.count(where);
    }

    async find(filter?: Filter<Quotation>,) {
        return this.quotationRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<Quotation>) {
        return this.quotationRepository.findById(id, filter);
    }

    async updateById(id: number, quotation: Quotation,) {
        await this.quotationRepository.updateById(id, quotation);
    }

    async deleteById(id: number) {
        await this.quotationRepository.deleteById(id);
    }

}
