import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {CommissionPaymentRecord} from '../models';
import {CommissionPaymentRecordRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class CommissionPaymentRecordService {
    constructor(
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
    ) { }


    async create(commissionPaymentRecord: Omit<CommissionPaymentRecord, 'id'>,) {
        return this.commissionPaymentRecordRepository.create(commissionPaymentRecord);
    }

    async find(filter?: Filter<CommissionPaymentRecord>,) {
        return this.commissionPaymentRecordRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<CommissionPaymentRecord>) {
        return this.commissionPaymentRecordRepository.findById(id, filter);
    }

    async updateById(id: number, commissionPaymentRecord: CommissionPaymentRecord,) {
        await this.commissionPaymentRecordRepository.updateById(id, commissionPaymentRecord);
    }

    async deleteById(id: number) {
        await this.commissionPaymentRecordRepository.deleteById(id);
    }
}
