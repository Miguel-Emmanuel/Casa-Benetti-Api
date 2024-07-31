import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {DeliveryRequest} from '../models';
import {DeliveryRequestRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DeliveryRequestService {
    constructor(
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
    ) { }

    async find(filter?: Filter<DeliveryRequest>,) {
        if (filter?.order) {
            filter.order = [...filter.order, 'deliveryDay DESC']
        } else {
            filter = {...filter, order: ['deliveryDay DESC']};
        }

        return this.deliveryRequestRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<DeliveryRequest>) {
        return this.deliveryRequestRepository.findById(id, filter);
    }
}
