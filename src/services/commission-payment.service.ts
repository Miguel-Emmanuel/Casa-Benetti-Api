import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {CommissionPaymentStatus} from '../enums';
import {schemaCommissionPaymentCreate, schemaCommissionPaymentUpdate} from '../joi.validation.ts/commission.validation';
import {ResponseServiceBindings} from '../keys';
import {CommissionPayment, CommissionPaymentCreate, Document} from '../models';
import {CommissionPaymentRecordRepository, CommissionPaymentRepository, DocumentRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CommissionPaymentService {
    constructor(
        @repository(CommissionPaymentRepository)
        public commissionPaymentRepository: CommissionPaymentRepository,
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
    ) { }

    async create(commissionPayment: Omit<CommissionPaymentCreate, 'id'>,) {
        await this.validateBodyCommission(commissionPayment);
        const {commissionPaymentRecordId, images} = commissionPayment;
        await this.findCommissionPaymentRecord(commissionPaymentRecordId);
        delete commissionPayment.images;
        const commissionCreate = await this.commissionPaymentRepository.create(commissionPayment);
        await this.documents(commissionCreate.id, images);
        return commissionCreate;
    }

    async find(filter?: Filter<CommissionPayment>,) {
        return this.commissionPaymentRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<CommissionPayment>) {
        await this.findCommissionPayment(id);
        const include: InclusionFilter[] = [
            {
                relation: 'documents',
                scope: {
                    fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'commissionPaymentId']
                }
            }
        ]
        if (filter?.include)
            filter.include = [
                ...filter.include,
                ...include
            ]
        else
            filter = {
                ...filter, include: [
                    ...include
                ]
            };
        const findCommissionPayment = await this.commissionPaymentRepository.findById(id, {
            fields: ["id", "paymentDate", "amount", "status"],
            ...filter,
        });

        const arrayDocuments = findCommissionPayment?.documents
            ? findCommissionPayment.documents.map((document) => {
                return {
                    id: document.id,
                    createdAt: document.createdAt,
                    fileURL: document.fileURL,
                    name: document.name,
                    extension: document.extension,
                };
            })
            : [];

        const {documents, ...data} = findCommissionPayment

        const value: any = {
            ...data,
            documents: arrayDocuments
        }

        return value
    }

    async updateById(id: number, commissionPayment: CommissionPaymentCreate,) {
        const commission = await this.findCommissionPayment(id);
        if (commission.status === CommissionPaymentStatus.PAGADO)
            throw this.responseService.badRequest("El pago ya fue realizado y no puede actualizarse.");
        await this.validateBodyCommissionUpdate(commissionPayment);
        const {commissionPaymentRecordId, images, status, amount} = commissionPayment;
        const {totalPaid, balance, commissionAmount} = await this.findCommissionPaymentRecord(commissionPaymentRecordId);
        if (status === CommissionPaymentStatus.PAGADO) {
            const totalPaidNew = totalPaid + amount;
            const balanceNew = balance - amount;
            const percentagePaid = this.calculatePercentagePaid(commissionAmount, totalPaidNew);
            await this.commissionPaymentRecordRepository.updateById(id, {balance: balanceNew, totalPaid: totalPaidNew, percentagePaid})
        }
        delete commissionPayment.images;
        await this.commissionPaymentRepository.updateById(id, commissionPayment);
        await this.documents(id, images);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    calculatePercentagePaid(total: number, totalPaid: number) {
        return (totalPaid / total) * 100;
    }

    async deleteById(id: number) {
        await this.commissionPaymentRepository.deleteById(id);
    }

    //

    async findCommissionPaymentRecord(id: number) {
        const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {id}});
        if (!commissionPaymentRecord)
            throw this.responseService.notFound('La comision no existe.');
        return commissionPaymentRecord
    }

    async findCommissionPayment(id: number) {
        const commissionPayment = await this.commissionPaymentRepository.findOne({where: {id}});
        if (!commissionPayment)
            throw this.responseService.notFound('La pago de comision no existe.');

        return commissionPayment;
    }

    async validateBodyCommission(data: Omit<CommissionPaymentCreate, 'id'>,) {
        try {
            await schemaCommissionPaymentCreate.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyCommissionUpdate(data: Omit<CommissionPaymentCreate, 'id'>,) {
        try {
            await schemaCommissionPaymentUpdate.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async documents(commissionId: number, documents?: Document[]) {
        if (documents)
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && element?.id) {
                    await this.documentRepository.updateById(element?.id, element);
                } else {
                    await this.commissionPaymentRepository.documents(commissionId).create(element);
                }
            }
    }
}
