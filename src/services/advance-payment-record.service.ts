import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {schameCreateAdvancePayment} from '../joi.validation.ts/advance-payment-record.validation';
import {ResponseServiceBindings} from '../keys';
import {AdvancePaymentRecord} from '../models';
import {AccountsReceivableRepository, AdvancePaymentRecordRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AdvancePaymentRecordService {
    constructor(
        @repository(AdvancePaymentRecordRepository)
        public advancePaymentRecordRepository: AdvancePaymentRecordRepository,
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }


    async create(advancePaymentRecord: Omit<AdvancePaymentRecord, 'id'>,) {
        await this.validateBodyAdvancePayment(advancePaymentRecord);
        const {accountsReceivableId} = advancePaymentRecord;
        const accountsReceivable = await this.findAccountReceivable(accountsReceivableId);
        const {advancePaymentRecords} = accountsReceivable;
        let consecutiveId = 1;
        if (advancePaymentRecords?.length > 0) {
            consecutiveId = advancePaymentRecords[0].consecutiveId + 1
        }
        return this.advancePaymentRecordRepository.create({...advancePaymentRecord, consecutiveId});
    }

    async count(where?: Where<AdvancePaymentRecord>,) {
        return this.advancePaymentRecordRepository.count(where);
    }
    async find(filter?: Filter<AdvancePaymentRecord>,) {
        return this.advancePaymentRecordRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AdvancePaymentRecord>) {
        return this.advancePaymentRecordRepository.findById(id, filter);
    }

    async updateById(id: number, advancePaymentRecord: AdvancePaymentRecord,) {
        await this.findAdvancePayment(id);
        await this.validateBodyAdvancePayment(advancePaymentRecord);
        const {accountsReceivableId} = advancePaymentRecord;
        const accountsReceivable = await this.findAccountReceivable(accountsReceivableId);
        const {advancePaymentRecords} = accountsReceivable;
        let consecutiveId = 1;
        if (advancePaymentRecords?.length > 0) {
            consecutiveId = advancePaymentRecords[0].consecutiveId + 1
        }
        await this.advancePaymentRecordRepository.updateById(id, {...advancePaymentRecord, consecutiveId});
    }

    async deleteById(id: number) {
        await this.advancePaymentRecordRepository.deleteById(id);
    }

    async findAdvancePayment(id: number) {
        const advancePaymentRecord = await this.advancePaymentRecordRepository.findOne({where: {id}});
        if (!advancePaymentRecord)
            throw this.responseService.badRequest("Cobro no existe.");
        return advancePaymentRecord;
    }

    async findAccountReceivable(id: number) {
        const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {id}, include: [{relation: 'advancePaymentRecords', scope: {order: ['consecutiveId DESC']}}]});
        if (!accountsReceivable)
            throw this.responseService.badRequest("Cuenta por cobrar no existe.");
        return accountsReceivable;
    }

    async validateBodyAdvancePayment(advancePaymentRecord: Omit<AdvancePaymentRecord, 'id'>,) {
        try {
            await schameCreateAdvancePayment.validateAsync(advancePaymentRecord);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }
}
