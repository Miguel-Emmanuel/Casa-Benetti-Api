import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
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

        const include: InclusionFilter[] = [
            {
                relation: 'customer',
            },
            {
                relation: 'purchaseOrders',
                scope: {
                    include: [
                        {
                            relation: 'proforma',
                            scope: {
                                include: [
                                    {
                                        relation: 'quotationProducts'
                                    }
                                ]
                            }
                        }
                    ]
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
            }

        const deliveryRequest = await this.deliveryRequestRepository.find(filter)
        return deliveryRequest.map(value => {
            const {id, customer, purchaseOrders, deliveryDay, status} = value;
            const {proforma} = purchaseOrders;
            const {quotationProducts} = proforma;
            return {
                id,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                quantity: quotationProducts?.length ?? 0,
                deliveryDay,
                status
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<DeliveryRequest>) {
        return this.deliveryRequestRepository.findById(id, filter);
    }
}
