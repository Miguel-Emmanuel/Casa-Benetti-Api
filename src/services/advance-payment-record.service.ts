import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {AdvancePaymentStatusE} from '../enums';
import {schameCreateAdvancePayment, schameCreateAdvancePaymentUpdate} from '../joi.validation.ts/advance-payment-record.validation';
import {ResponseServiceBindings} from '../keys';
import {AdvancePaymentRecord, AdvancePaymentRecordCreate} from '../models';
import {DocumentSchema} from '../models/base/document.model';
import {AccountsReceivableRepository, AdvancePaymentRecordRepository, DocumentRepository, UserRepository} from '../repositories';
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
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) { }


    async create(advancePaymentRecord: Omit<AdvancePaymentRecordCreate, 'id'>,) {
        await this.validateBodyAdvancePayment(advancePaymentRecord);
        const {accountsReceivableId, vouchers} = advancePaymentRecord;
        const accountsReceivable = await this.findAccountReceivable(accountsReceivableId);
        const {advancePaymentRecords} = accountsReceivable;
        let consecutiveId = 1;
        if (advancePaymentRecords?.length > 0)
            consecutiveId = advancePaymentRecords[0].consecutiveId + 1

        delete advancePaymentRecord?.vouchers;
        const advancePaymentRecordRes = await this.advancePaymentRecordRepository.create({...advancePaymentRecord, consecutiveId});
        await this.createDocuments(advancePaymentRecordRes.id, vouchers);
        return advancePaymentRecordRes;
    }

    async createDocuments(advancePaymentRecordId: number, documents?: DocumentSchema[]) {
        if (documents)
            for (let index = 0; index < documents?.length; index++) {
                const {fileURL, name, extension, id} = documents[index];
                if (id)
                    await this.documentRepository.updateById(id, {...documents[index]});
                else
                    await this.advancePaymentRecordRepository.documents(advancePaymentRecordId).create({fileURL, name, extension})

            }
    }

    async count(where?: Where<AdvancePaymentRecord>,) {
        return this.advancePaymentRecordRepository.count(where);
    }
    async find(filter?: Filter<AdvancePaymentRecord>,) {
        return this.advancePaymentRecordRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AdvancePaymentRecord>) {
        await this.findAdvancePayment(id);
        const include: InclusionFilter[] = [
            {
                relation: 'documents',
                scope: {
                    fields: ['id', 'createdAt', 'createdBy', 'fileURL', 'name', 'extension', 'advancePaymentRecordId', 'updatedBy', 'updatedAt']
                }
            },
            {
                relation: 'accountsReceivable',
                scope: {
                    fields: ['id', 'totalSale']
                }
            },

        ]
        if (filter?.include)
            filter.include = [
                ...filter.include,
                ...include
            ]
        else
            filter = {
                ...filter, include: [
                    ...include,
                ]
            };
        const advancePaymentRecord = await this.advancePaymentRecordRepository.findById(id, filter);

        for (let index = 0; index < advancePaymentRecord?.documents?.length; index++) {
            const document = advancePaymentRecord?.documents[index];
            if (document) {
                const element: any = document;
                const createdBy = await this.userRepository.findByIdOrDefault(element.createdBy);
                const updatedBy = await this.userRepository.findByIdOrDefault(element.updatedBy);
                element.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
                element.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
            }
        }
        return advancePaymentRecord
    }

    async updateById(id: number, advancePaymentRecord: AdvancePaymentRecordCreate,) {
        const payment = await this.findAdvancePayment(id);
        if (payment.status === AdvancePaymentStatusE.PAGADO)
            throw this.responseService.badRequest("El cobro ya fue pagado y no puede actualizarse.");

        const {vouchers, status, salesDeviation} = advancePaymentRecord;
        const {conversionAmountPaid, accountsReceivable} = payment;
        let {totalSale, totalPaid, updatedTotal} = accountsReceivable;
        if (salesDeviation > 0) {
            const updatedTotalNew = totalSale + salesDeviation;
            updatedTotal = updatedTotalNew
            await this.accountsReceivableRepository.updateById(accountsReceivable.id, {updatedTotal: updatedTotalNew})
        }

        if (status && status === AdvancePaymentStatusE.PAGADO) {
            let totalVenta = totalSale;
            if (updatedTotal > 0)
                totalVenta = updatedTotal;

            const balance = totalVenta - conversionAmountPaid;
            const totalPaidNew = totalPaid + conversionAmountPaid;
            await this.accountsReceivableRepository.updateById(accountsReceivable.id, {balance, totalPaid: totalPaidNew})
        }
        await this.validateBodyAdvancePaymentUpdate(advancePaymentRecord);
        delete advancePaymentRecord?.vouchers;
        await this.createDocuments(id, vouchers);
        await this.advancePaymentRecordRepository.updateById(id, {...advancePaymentRecord});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async deleteById(id: number) {
        await this.advancePaymentRecordRepository.deleteById(id);
    }

    async findAdvancePayment(id: number) {
        const advancePaymentRecord = await this.advancePaymentRecordRepository.findOne({where: {id}, include: [{relation: 'accountsReceivable'}]});
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

    async validateBodyAdvancePayment(advancePaymentRecord: Omit<AdvancePaymentRecordCreate, 'id'>,) {
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

    async validateBodyAdvancePaymentUpdate(advancePaymentRecord: Omit<AdvancePaymentRecordCreate, 'id'>,) {
        try {
            await schameCreateAdvancePaymentUpdate.validateAsync(advancePaymentRecord);
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
