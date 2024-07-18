import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {AccountPayableHistoryStatusE, ConvertCurrencyToEUR, ExchangeRateE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {AccountPayableHistory, AccountPayableHistoryCreate, Document} from '../models';
import {AccountPayableHistoryRepository, AccountPayableRepository, DocumentRepository} from '../repositories';
import {ResponseService} from './response.service';

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
    ) { }


    async create(accountPayableHistory: Omit<AccountPayableHistoryCreate, 'id'>,) {
        const {accountPayableId, images} = accountPayableHistory;
        const accountPayable = await this.findAccountPayable(accountPayableId);
        if (accountPayableHistory.status === AccountPayableHistoryStatusE.PAGADO) {
            const newAmount = this.convertCurrencyToEUR(accountPayableHistory.amount, accountPayableHistory.currency)
            const newTotalPaid = accountPayable.totalPaid + newAmount
            const newBalance = accountPayable.balance - newAmount
            await this.accountPayableRepository.updateById(accountPayableId, {totalPaid: newTotalPaid, balance: newBalance})
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

        const {totalPaid, balance} = await this.findAccountPayable(accountPayableId);

        if (accountPayableHistory.status === AccountPayableHistoryStatusE.PAGADO) {
            const newAmount = this.convertCurrencyToEUR(accountPayableHistory.amount, accountPayableHistory.currency)
            const newTotalPaid = totalPaid + newAmount
            const newBalance = balance - newAmount
            await this.accountPayableRepository.updateById(accountPayableId, {totalPaid: newTotalPaid, balance: newBalance})
        }

        delete accountPayableHistory.images;
        await this.createDocument(id, images);
        await this.accountPayableHistoryRepository.updateById(id, accountPayableHistory);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
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
                }
            ]
        })
        if (!account)
            throw this.responseService.notFound("La cuenta por pagar no se ha encontrado.")
        return account;
    }

    convertCurrencyToEUR(amount: number, currency: ExchangeRateE): number {
        if (currency === ExchangeRateE.MXN)
            return amount * ConvertCurrencyToEUR.MXN
        else if (currency === ExchangeRateE.USD)
            return amount * ConvertCurrencyToEUR.USD
        else
            return amount * ConvertCurrencyToEUR.EURO
    }
}
