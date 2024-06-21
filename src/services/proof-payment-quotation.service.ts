import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {Document, ProofPaymentQuotation, ProofPaymentQuotationCreate} from '../models';
import {ProofPaymentQuotationRepository, QuotationRepository} from '../repositories';
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
    ) { }


    async create(proofPaymentQuotation: Omit<ProofPaymentQuotationCreate, 'id'>,) {
        const {quotationId, images} = proofPaymentQuotation;
        await this.findQuotationById(quotationId);
        const proofPaymentQuotationResponse = await this.proofPaymentQuotationRepository.create(proofPaymentQuotation);
        await this.createDocuments(proofPaymentQuotationResponse.id, images)
        return proofPaymentQuotationResponse;
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

    async updateById(id: number, proofPaymentQuotation: ProofPaymentQuotation,) {
        await this.proofPaymentQuotationRepository.updateById(id, proofPaymentQuotation);
    }

    async deleteById(id: number) {
        await this.proofPaymentQuotationRepository.deleteById(id);
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}})
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation;
    }

    async createDocuments(proofPaymentQuotationId: number, documents: Document[]) {
        for (let index = 0; index < documents?.length; index++) {
            const element = documents[index];
            if (element) {
                await this.proofPaymentQuotationRepository.documents(proofPaymentQuotationId).create(element);
            }
        }
    }
}
