import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {ExchangeRateE} from '../enums';
import {schemaProofPaymentQuotationInside} from '../joi.validation.ts/proof-payment.validation';
import {ResponseServiceBindings} from '../keys';
import {Document, ProofPaymentQuotation, ProofPaymentQuotationCreate} from '../models';
import {DocumentRepository, ProofPaymentQuotationRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProofPaymentQuotationService {
    constructor(
        @repository(ProofPaymentQuotationRepository)
        public proofPaymentQuotationRepository: ProofPaymentQuotationRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
    ) { }


    async create(proofPaymentQuotation: ProofPaymentQuotationCreate) {
        const {quotationId} = proofPaymentQuotation;
        const {images, ...bodyProofPayment} = proofPaymentQuotation;
        await this.findQuotationById(quotationId);
        await this.validateBodyProofPayment(proofPaymentQuotation);
        const exchangeRateAmount = this.calculateExchangeRateAmount(bodyProofPayment.exchangeRate);
        const conversionAdvance = this.calculateConversionAdvance(exchangeRateAmount, bodyProofPayment.advanceCustomer);
        const proofPaymentQuotationResponse = await this.proofPaymentQuotationRepository.create({...bodyProofPayment, exchangeRateAmount, conversionAdvance})
        await this.updateDocuments(proofPaymentQuotationResponse.id, images)
        return proofPaymentQuotationResponse;
    }

    calculateExchangeRateAmount(exchangeRate: ExchangeRateE) {
        switch (exchangeRate) {
            case ExchangeRateE.EUR:
                return 1.0;
                break;
            case ExchangeRateE.MXN:
                return 2.0;
                break;
            case ExchangeRateE.USD:
                return 3.0;
                break;
            default:
                return 0;
                break;
        }
    }

    calculateConversionAdvance(exchangeRateAmount: number, advanceCustomer: number) {
        return exchangeRateAmount === 0 ? advanceCustomer : (advanceCustomer * exchangeRateAmount);
    }

    async count(where?: Where<ProofPaymentQuotation>,) {
        return this.proofPaymentQuotationRepository.count(where);
    }
    async find(filter?: Filter<ProofPaymentQuotation>,) {
        return this.proofPaymentQuotationRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<ProofPaymentQuotation>) {
        return this.proofPaymentQuotationRepository.findById(id, filter);
    }

    async validateBodyProofPayment(data: ProofPaymentQuotationCreate) {
        try {
            await schemaProofPaymentQuotationInside.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async updateById(id: number, proofPaymentQuotation: ProofPaymentQuotationCreate) {
        const {quotationId} = proofPaymentQuotation;
        const {images, ...bodyProofPayment} = proofPaymentQuotation;
        await this.findProofPaymentById(id);
        await this.findQuotationById(quotationId);
        await this.validateBodyProofPayment(proofPaymentQuotation);
        await this.updateDocuments(id, images)
        await this.proofPaymentQuotationRepository.updateById(id, bodyProofPayment);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async deleteById(id: number) {
        await this.findProofPaymentById(id);
        await this.proofPaymentQuotationRepository.deleteById(id);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}})
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation;
    }

    async findProofPaymentById(id: number) {
        const proofPayment = await this.proofPaymentQuotationRepository.findOne({where: {id}})
        if (!proofPayment)
            throw this.responseService.badRequest('El comprobante de pago no existe.');
        return proofPayment;
    }

    async updateProofPayments(proofPaymentQuotationId: number, proofPaymentQuotation: ProofPaymentQuotationCreate) {
        await this.findProofPaymentById(proofPaymentQuotationId);
        const {images, ...bodyProofPayment} = proofPaymentQuotation;
        await this.updateDocuments(proofPaymentQuotation.id, images)
        return this.proofPaymentQuotationRepository.updateById(proofPaymentQuotationId, bodyProofPayment);
    }

    async createDocuments(proofPaymentQuotationId: number, documents: Document[]) {
        for (let index = 0; index < documents?.length; index++) {
            const element = documents[index];
            if (element?.id) {
                await this.proofPaymentQuotationRepository.documents(proofPaymentQuotationId).create(element);
            }
        }
    }

    async updateDocuments(proofPaymentQuotationId: number, documents: Document[]) {
        for (let index = 0; index < documents?.length; index++) {
            const element = documents[index];
            if (element && element?.id) {
                await this.documentRepository.updateById(element?.id, element);
            } else {
                await this.proofPaymentQuotationRepository.documents(proofPaymentQuotationId).create(element);
            }
        }
    }
}
