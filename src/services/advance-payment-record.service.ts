import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {AdvancePaymentStatusE, ExchangeRateQuotationE} from '../enums';
import {schameCreateAdvancePayment, schameCreateAdvancePaymentUpdate} from '../joi.validation.ts/advance-payment-record.validation';
import {ResponseServiceBindings} from '../keys';
import {AdvancePaymentRecord, AdvancePaymentRecordCreate, Quotation} from '../models';
import {DocumentSchema} from '../models/base/document.model';
import {AccountsReceivableRepository, AdvancePaymentRecordRepository, DocumentRepository, ProjectRepository, PurchaseOrdersRepository, QuotationRepository, UserRepository} from '../repositories';
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
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
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

        const {vouchers, status, salesDeviation, projectId} = advancePaymentRecord;
        const {conversionAmountPaid, accountsReceivable} = payment;

        let {totalSale, totalPaid, updatedTotal, typeCurrency} = accountsReceivable;
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
            await this.createPurchaseOrders(projectId, accountsReceivable.id, totalPaidNew, typeCurrency,)
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



    async createPurchaseOrders(projectId: number, accountsReceivableId: number, totalPaid: number, typeCurrency: string) {
        const findProjectQuotation = await this.findProjectQuotation(projectId)
        const { } = findProjectQuotation
        const {conversionAdvance} = this.getPricesQuotation(findProjectQuotation.quotation);

        if (conversionAdvance && totalPaid >= conversionAdvance) {
            await this.findProjectProforma(projectId, accountsReceivableId, typeCurrency)
        }


    }

    async findProjectQuotation(id: number) {
        console.log("PROJECT", id);

        const findProjectQuotation = await this.projectRepository.findOne({where: {id}, include: [{relation: "quotation"}]})
        if (!findProjectQuotation)
            throw this.responseService.badRequest("El proyecto no existe.");
        return findProjectQuotation
    }

    async findProjectProforma(projectId: number, accountsReceivableId: number, typeCurrency: string) {
        //cotizacion where projectid, includes cotizacionproducti filtrar por currency tomar brand y provider
        //cada ordern de compra guardar el id de cuentas por cobrar (Accounts-receivlables (al padre))

        const findQuotation = await this.projectRepository.findOne({
            where: {
                id: projectId
            },
            include: [{relation: "quotation"}]
        })


        // await this.purchaseOrdersRepository.create({accountPayableId: accountsPayable.id, status: PurchaseOrdersStatus.NUEVA, proformaId, accountsReceivableId}, /*{transaction}*/)

        // const findProjectProforma = await this.projectRepository.findOne({
        //     where: {id: idProject}, include: [{
        //         relation: "proformas", scope: {
        //             where: {
        //                 // brand,
        //                 // provider
        //             }
        //         }
        //     }]
        // })
        // if (!findProjectProforma)
        //     throw this.responseService.badRequest("El proyecto no existe.");
        // else if (!findProjectProforma.proformas)
        //     throw this.responseService.badRequest("La proforma no existe.");


        // return findProjectProforma
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

    getPricesQuotation(quotation: Quotation) {
        const {exchangeRateQuotation, } = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const {subtotalEUR, percentageAdditionalDiscount, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, exchangeRate, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR, exchangeRateAmountEUR} = quotation
            const body = {
                subtotal: subtotalEUR,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountEUR,
                percentageIva: percentageIva,
                iva: ivaEUR,
                total: totalEUR,
                percentageAdvance: percentageAdvanceEUR,
                advance: advanceEUR,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountEUR,
                advanceCustomer: advanceCustomerEUR,
                conversionAdvance: conversionAdvanceEUR,
                balance: balanceEUR,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscount, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, exchangeRate, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD, exchangeRateAmountUSD} = quotation
            const body = {
                subtotal: subtotalUSD,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountUSD,
                percentageIva: percentageIva,
                iva: ivaUSD,
                total: totalUSD,
                percentageAdvance: percentageAdvanceUSD,
                advance: advanceUSD,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountUSD,
                advanceCustomer: advanceCustomerUSD,
                conversionAdvance: conversionAdvanceUSD,
                balance: balanceUSD,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscount, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, exchangeRate, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN, exchangeRateAmountMXN} = quotation
            const body = {
                subtotal: subtotalMXN,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountMXN,
                percentageIva: percentageIva,
                iva: ivaMXN,
                total: totalMXN,
                percentageAdvance: percentageAdvanceMXN,
                advance: advanceMXN,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountMXN,
                advanceCustomer: advanceCustomerMXN,
                conversionAdvance: conversionAdvanceMXN,
                balance: balanceMXN,
            }
            return body;
        }
        const body = {
            subtotal: null,
            percentageAdditionalDiscount: null,
            additionalDiscount: null,
            percentageIva: null,
            iva: null,
            total: null,
            percentageAdvance: null,
            advance: null,
            exchangeRate: null,
            exchangeRateAmount: null,
            advanceCustomer: null,
            conversionAdvance: null,
            balance: null,
        }
        return body;
    }
}
