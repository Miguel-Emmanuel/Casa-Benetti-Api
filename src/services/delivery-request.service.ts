import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {DeliveryRequest, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {DeliveryRequestRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class DeliveryRequestService {
    constructor(
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
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
        try {
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
                                            relation: 'quotationProducts',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'product',
                                                        scope: {
                                                            include: [
                                                                {
                                                                    relation: 'document'
                                                                },
                                                                {
                                                                    relation: 'line'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ],
                                            }
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
                };

            const deliveryRequest = await this.deliveryRequestRepository.findOne({where: {id}, ...filter});
            if (!deliveryRequest)
                throw this.responseService.badRequest("Solicitud de entrega no encontrada.")


            const {purchaseOrders, deliveryDay, status} = deliveryRequest;
            const {proforma} = purchaseOrders;
            const {quotationProducts} = proforma;
            return {
                id,
                deliveryDay,
                status,
                feedback: null,
                products: quotationProducts.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                    const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing} = value;
                    const {document, line, name} = product;
                    const descriptionParts = [
                        line?.name,
                        name,
                        mainMaterial,
                        mainFinish,
                        secondaryMaterial,
                        secondaryFinishing
                    ];
                    const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                    return {
                        id: productId,
                        SKU,
                        image: document?.fileURL,
                        description,
                    }
                })
            };
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async validateDeloveryRequestById(id: number,) {
        const deliveryRequest = await this.deliveryRequestRepository.findOne({where: {id}});
        if (!deliveryRequest)
            throw this.responseService.badRequest("Solicitud de entrega no encontrada.")
    }
}
