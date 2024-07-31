import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import BigNumber from 'bignumber.js';
import {AccountPayableHistoryStatusE, ConvertCurrencyToEUR, ConvertCurrencyToMXN, ConvertCurrencyToUSD, ExchangeRateE, ProformaCurrencyE, PurchaseOrdersStatus, QuotationProductStatusE, TypeUserE} from '../enums';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {AccountPayableHistory, AccountPayableHistoryCreate, Document, PurchaseOrders} from '../models';
import {AccountPayableHistoryRepository, AccountPayableRepository, BrandRepository, DocumentRepository, ProviderRepository, PurchaseOrdersRepository, QuotationProductsRepository, UserRepository} from '../repositories';
import {CalculateScheledDateService} from './calculate-scheled-date.service';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountPayableHistoryService {
    constructor(
        @repository(AccountPayableHistoryRepository)
        public accountPayableHistoryRepository: AccountPayableHistoryRepository,
        @repository(AccountPayableRepository)
        public accountPayableRepository: AccountPayableRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(ProviderRepository)
        public providerRepository: ProviderRepository,
        @service()
        public calculateScheledDateService: CalculateScheledDateService,
        @repository(BrandRepository)
        public brandRepository: BrandRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) { }


    async create(accountPayableHistory: Omit<AccountPayableHistoryCreate, 'id'>,) {
        const {accountPayableId, images} = accountPayableHistory;
        const accountPayable = await this.findAccountPayable(accountPayableId);
        if (accountPayableHistory.status === AccountPayableHistoryStatusE.PAGADO) {
            const newAmount = await this.convertCurrency(accountPayableHistory.amount, accountPayableHistory.currency, accountPayableId)
            const newTotalPaid = accountPayable.totalPaid + newAmount
            const newBalance = accountPayable.balance - newAmount
            await this.accountPayableRepository.updateById(accountPayableId, {totalPaid: this.roundToTwoDecimals(newTotalPaid), balance: this.roundToTwoDecimals(newBalance)})
        }
        delete accountPayableHistory.images;
        const accountPayableHistoryRes = await this.accountPayableHistoryRepository.create({...accountPayableHistory, providerId: accountPayable.proforma?.providerId});
        await this.createDocument(accountPayableHistoryRes.id, images);
        return accountPayableHistoryRes;
    }

    async find(filter?: Filter<AccountPayableHistory>,) {
        return this.accountPayableHistoryRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AccountPayableHistory>) {
        const include: InclusionFilter[] = [
            {
                relation: 'documents',
                scope: {
                    fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'accountPayableHistoryId']
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
        await this.findAccountPayableHistory(id);
        return this.accountPayableHistoryRepository.findById(id, filter);
    }
    async updateById(id: number, accountPayableHistory: AccountPayableHistoryCreate,) {
        const {accountPayableId, images, status} = accountPayableHistory;
        const findAccountPayableHistory = await this.findAccountPayableHistory(id);
        if (findAccountPayableHistory.status === AccountPayableHistoryStatusE.PAGADO)
            throw this.responseService.badRequest("El pago ya fue realizado y no puede actualizarse.");

        const {totalPaid, balance, total, purchaseOrders, proforma} = await this.findAccountPayable(accountPayableId);

        if (accountPayableHistory.status === AccountPayableHistoryStatusE.PAGADO) {
            const newAmount = await this.convertCurrency(accountPayableHistory.amount, accountPayableHistory.currency, accountPayableId)
            const newTotalPaid = this.roundToTwoDecimals(totalPaid + newAmount)
            const newBalance = balance - newAmount
            await this.accountPayableRepository.updateById(accountPayableId, {totalPaid: newTotalPaid, balance: this.roundToTwoDecimals(newBalance)})
            await this.validateProductionEndDate(newTotalPaid, total, purchaseOrders, proforma.id, proforma.brandId,)
            await this.settleAccountPayable(newTotalPaid, total, accountPayableId, purchaseOrders.id);
        }

        delete accountPayableHistory.images;
        await this.createDocument(id, images);
        await this.accountPayableHistoryRepository.updateById(id, accountPayableHistory);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async validateProductionEndDate(totalPaid: number, total: number, purchaseOrder: PurchaseOrders, providerId?: number, brandId?: number) {
        if (!purchaseOrder.productionEndDate) {
            let {advanceConditionPercentage} = await this.providerRepository.findById(providerId);
            advanceConditionPercentage = advanceConditionPercentage ?? 100;
            const porcentage = ((totalPaid / total) * 100);
            if (porcentage >= advanceConditionPercentage) {
                let {productionTime} = await this.brandRepository.findById(brandId);
                let scheduledDate = new Date();
                const productionEndDate = this.calculateScheledDateService.addBusinessDays(scheduledDate, productionTime ?? 0)
                await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {productionEndDate, status: PurchaseOrdersStatus.EN_PRODUCCION})
            }
        }

    }

    async settleAccountPayable(totalPaid: number, total: number, accountPayableId: number, purchaseOrderId?: number) {
        if (totalPaid === total) {
            const purchaseOrder = await this.purchaseOrdersRepository.findById(purchaseOrderId, {
                include: [
                    {
                        relation: 'proforma',
                        scope: {
                            fields: ['id', 'quotationProducts'],
                            include: [
                                {
                                    relation: 'quotationProducts',
                                    scope: {
                                        fields: ['id', 'proformaId']
                                    }
                                }
                            ]
                        }
                    }
                ]
            })
            await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.EN_RECOLECCION, isPaid: true})
            await this.accountPayableRepository.updateById(accountPayableId, {isPaid: true})
            const {proforma} = purchaseOrder
            const {quotationProducts} = proforma;
            for (let index = 0; index < quotationProducts.length; index++) {
                const element = quotationProducts[index];
                await this.quotationProductsRepository.updateById(element.id, {status: QuotationProductStatusE.RECOLECCION})
            }
            await this.notifyLogistics(purchaseOrder.id);
        }
    }

    async notifyLogistics(purchaseOrderId?: number) {
        const users = await this.userRepository.find({where: {typeUser: TypeUserE.ADMINISTRADOR}})
        const emails = users.map(value => value.email);
        const options = {
            to: emails,
            templateId: SendgridTemplates.NOTIFICATION_LOGISTIC.id,
            dynamicTemplateData: {
                subject: SendgridTemplates.NOTIFICATION_LOGISTIC.subject,
                purchaseOrderId
            }
        };
        await this.sendgridService.sendNotification(options);
    }



    roundToTwoDecimals(num: number): number {
        return Number(new BigNumber(num).toFixed(2));
    }
    async deleteById(id: number,) {
        await this.accountPayableHistoryRepository.deleteById(id);
    }

    /** */

    async createDocument(accountPayableHistoryId: number, documents?: Document[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.accountPayableHistoryRepository.documents(accountPayableHistoryId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }

    async findAccountPayableHistory(id: number) {
        const account = await this.accountPayableHistoryRepository.findOne({where: {id}})
        if (!account)
            throw this.responseService.notFound("El pago no se ha encontrado.")
        return account;
    }

    async findAccountPayable(id: number) {
        const account = await this.accountPayableRepository.findOne({
            where: {id},
            include: [
                {
                    relation: 'proforma',
                },
                {
                    relation: 'purchaseOrders',
                    scope: {
                        fields: ['id', 'accountPayableId', 'productionEndDate']
                    }
                }
            ]
        })
        if (!account)
            throw this.responseService.notFound("La cuenta por pagar no se ha encontrado.")
        return account;
    }

    async convertCurrency(accountPayableAmount: number, accountPayableCurrency: ExchangeRateE, accountPayableId: number): Promise<number> {
        const findAccountProforma = await this.accountPayableRepository.findOne({
            where: {id: accountPayableId},
            include: [{relation: "proforma"}]
        })

        let mount = 0
        if (findAccountProforma && findAccountProforma?.proforma) {
            const proformaCurrency = findAccountProforma?.proforma?.currency
            if (proformaCurrency === ProformaCurrencyE.EURO) {
                if (accountPayableCurrency === ExchangeRateE.MXN)
                    mount = accountPayableAmount * ConvertCurrencyToEUR.MXN
                else if (accountPayableCurrency === ExchangeRateE.USD)
                    mount = accountPayableAmount * ConvertCurrencyToEUR.USD
                else
                    mount = accountPayableAmount * ConvertCurrencyToEUR.EURO
            }
            else if (proformaCurrency === ProformaCurrencyE.PESO_MEXICANO) {
                if (accountPayableCurrency === ExchangeRateE.MXN)
                    mount = accountPayableAmount * ConvertCurrencyToMXN.MXN
                else if (accountPayableCurrency === ExchangeRateE.USD)
                    mount = accountPayableAmount * ConvertCurrencyToMXN.USD
                else
                    mount = accountPayableAmount * ConvertCurrencyToMXN.EURO
            }
            else if (proformaCurrency === ProformaCurrencyE.USD) {
                if (accountPayableCurrency === ExchangeRateE.MXN)
                    mount = accountPayableAmount * ConvertCurrencyToUSD.MXN
                else if (accountPayableCurrency === ExchangeRateE.USD)
                    mount = accountPayableAmount * ConvertCurrencyToUSD.USD
                else
                    mount = accountPayableAmount * ConvertCurrencyToUSD.EURO
            }
        }
        return mount

    }
}
