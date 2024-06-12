import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {Quotation} from '../models';
import {QuotationRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class QuotationService {
    constructor(
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
    ) { }

    async create(quotation: Omit<Quotation, 'id'>,) {
        return this.quotationRepository.create(quotation);
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
