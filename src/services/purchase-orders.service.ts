import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {PurchaseOrders} from '../models';
import {PurchaseOrdersRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseOrdersService {
    constructor(
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
    ) { }


    async create(purchaseOrders: Omit<PurchaseOrders, 'id'>,) {
        return this.purchaseOrdersRepository.create(purchaseOrders);
    }

    async count(where?: Where<PurchaseOrders>,) {
        return this.purchaseOrdersRepository.count(where);
    }

    async find(filter?: Filter<PurchaseOrders>,) {
        return this.purchaseOrdersRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<PurchaseOrders>) {
        return this.purchaseOrdersRepository.findById(id, filter);
    }

    async updateById(id: number, purchaseOrders: PurchaseOrders,) {
        await this.purchaseOrdersRepository.updateById(id, purchaseOrders);
    }

    async deleteById(id: number) {
        await this.purchaseOrdersRepository.deleteById(id);
    }
}
