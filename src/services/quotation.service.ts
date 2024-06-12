import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {CreateQuotation} from '../interface';
import {schemaCreateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class QuotationService {
    constructor(
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }

    async create(data: CreateQuotation) {
        const {client, commissions, id} = data;
        if (id === null) {

        } else {
            await this.findQuotationById(id);
        }
        await this.validateBodyQuotation(data);

        const quotation = {

        }
        return this.quotationRepository.create(quotation);
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
