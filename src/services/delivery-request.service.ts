import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import dayjs from 'dayjs';
import {DeliveryRequestStatusE, PurchaseOrdersStatus, QuotationProductStatusE} from '../enums';
import {schemaDeliveryRequestPatch, schemaDeliveryRequestPatchStatus} from '../joi.validation.ts/delivery-request.validation';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {DeliveryRequest, PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {DeliveryRequestRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository, UserRepository} from '../repositories';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

@injectable({scope: BindingScope.TRANSIENT})
export class DeliveryRequestService {
    constructor(
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
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
                                        relation: 'quotationProducts',
                                        scope: {
                                            where: {
                                                status: QuotationProductStatusE.ENTREGADO
                                            }
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
            }

        const deliveryRequest = await this.deliveryRequestRepository.find(filter)
        return deliveryRequest.map(value => {
            const {id, customer, purchaseOrders, deliveryDay, status} = value;
            let quantity = 0;
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                const {proforma} = element;
                const {quotationProducts} = proforma;
                quantity += quotationProducts?.length ?? 0
            }
            return {
                id,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                quantity,
                deliveryDay,
                status
            }
        });
    }

    async findByProjectiD(projectId: number, filter?: Filter<DeliveryRequest>,) {
        if (filter?.order) {
            filter.order = [...filter.order, 'deliveryDay DESC']
        } else {
            filter = {...filter, order: ['deliveryDay DESC']};
        }
        if (filter?.where) {
            filter.where = {...filter.where, projectId}
        } else {
            filter = {...filter, where: {projectId}};
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
                                        relation: 'quotationProducts',
                                        scope: {
                                            where: {
                                                status: QuotationProductStatusE.ENTREGADO
                                            }
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
            }

        const deliveryRequest = await this.deliveryRequestRepository.find(filter)
        return deliveryRequest.map(value => {
            const {id, customer, purchaseOrders, deliveryDay, status} = value;
            let quantity = 0;
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                const {proforma} = element;
                const {quotationProducts} = proforma;
                quantity += quotationProducts?.length ?? 0
            }
            return {
                id,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                quantity,
                deliveryDay,
                status
            }
        });
    }

    async findLogistic(filter?: Filter<DeliveryRequest>,) {
        try {
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
                let quantity = 0;
                for (let index = 0; index < purchaseOrders.length; index++) {
                    const element = purchaseOrders[index];
                    const {proforma} = element;
                    const {quotationProducts} = proforma;
                    quantity += quotationProducts?.length ?? 0
                }
                return {
                    id,
                    customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                    quantity,
                    deliveryDay,
                    status,
                }
            });
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
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


            const {purchaseOrders, deliveryDay, status, comment} = deliveryRequest;
            return {
                id,
                deliveryDay,
                status,
                feedback: null,
                comment,
                purchaseOrders: purchaseOrders.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                    const {id: purchaseOrderid, proforma} = value;
                    const {quotationProducts} = proforma;
                    return {
                        id: purchaseOrderid,
                        products: quotationProducts.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, status: statusProduct} = value;
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
                                isSelected: statusProduct === QuotationProductStatusE.ENTREGADO ? true : false
                            }
                        })
                    }
                }),
            };
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async findByIdLogistic(id: number, filter?: FilterExcludingWhere<DeliveryRequest>) {
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
                                                where: {
                                                    status: QuotationProductStatusE.ENTREGADO
                                                },
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


            const {purchaseOrders, deliveryDay, status, customer, projectId, comment} = deliveryRequest;
            let quantity = 0;
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                const {proforma} = element;
                const {quotationProducts} = proforma;
                quantity += quotationProducts?.length ?? 0
            }
            return {
                id: projectId,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                customerAddress: customer?.address,
                quantity,
                deliveryDay,
                status,
                comment,
                purchaseOrders: purchaseOrders.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                    const {id: purchaseOrderid, proforma} = value;
                    const {quotationProducts} = proforma;
                    return {
                        id: purchaseOrderid,
                        products: quotationProducts.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, status: statusProduct} = value;
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
                                isSelected: statusProduct === QuotationProductStatusE.ENTREGADO ? true : false
                            }
                        })
                    }
                }),
            };
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async updateDeliveryRequest(id: number, data: {status: DeliveryRequestStatusE, reason?: string},) {
        await this.validateDeloveryRequestById(id);
        await this.validateBodyDeliveryRequestPatchStatus(data);
        const {status} = data;
        await this.deliveryRequestRepository.updateById(id, {status})
        if (status === DeliveryRequestStatusE.RECHAZADA)
            await this.notifyLogisticsRejected(id);

        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async patch(id: number, data: {deliveryDay: string, comment: string, purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]}) {
        const deliveryRequest = await this.validateDeloveryRequestById(id);
        await this.validateBodyDeliveryRequestPatch(data);
        if (deliveryRequest.status !== DeliveryRequestStatusE.POR_VALIDAR && deliveryRequest.status !== DeliveryRequestStatusE.RECHAZADA)
            throw this.responseService.badRequest("Solicitud de entrega no puede ser actualizada.");

        const {comment, deliveryDay, purchaseOrders} = data
        await this.deliveryRequestRepository.updateById(id, {comment, deliveryDay});

        for (let index = 0; index < purchaseOrders.length; index++) {
            const {products, id: purchaseOrderId} = purchaseOrders[index];
            for (let index = 0; index < products.length; index++) {
                const {id, isSelected} = products[index];
                if (isSelected)
                    await this.quotationProductsRepository.updateById(id, {status: QuotationProductStatusE.ENTREGADO})
            }
            const searchSelected = products.filter(value => value.isSelected === true);


            if (products.length === searchSelected.length)
                await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.ENTREGA, deliveryRequestId: id})
            else
                await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.ENTREGA_PARCIAL, deliveryRequestId: id})
        }
        await this.notifyLogistics(deliveryRequest.projectId, deliveryDay);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async notifyLogisticsRejected(id: number) {
        const delivery = await this.deliveryRequestRepository.findById(id, {
            include: [
                {
                    relation: 'project',
                    scope: {
                        include: [
                            {
                                relation: 'quotation'
                            }
                        ]
                    }
                }
            ]
        })
        const email = delivery?.project?.quotation?.mainProjectManagerId;
        const options = {
            to: email,
            templateId: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC_REJECTED.id,
            dynamicTemplateData: {
                subject: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC_REJECTED.subject,
            }
        };
        await this.sendgridService.sendNotification(options);
    }

    async notifyLogistics(projectId: number, deliveryDay: string) {
        const project = await this.projectRepository.findById(projectId, {
            include: [
                {
                    relation: 'customer'
                },
                {
                    relation: 'quotation',
                    scope: {
                        include: [
                            {
                                relation: 'mainProjectManager'
                            }
                        ]
                    }
                }
            ]
        });
        const users = await this.userRepository.find({where: {isLogistics: true}})
        const emails = users.map(value => value.email);
        const {customer, quotation} = project;
        const {mainProjectManager} = quotation;
        const options = {
            to: emails,
            templateId: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC.id,
            dynamicTemplateData: {
                subject: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC.subject,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                projectId: project.projectId,
                mainPM: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                date: dayjs(deliveryDay).format('DD/MM/YYYY')
            }
        };
        await this.sendgridService.sendNotification(options);
    }

    async validateBodyDeliveryRequestPatch(data: {deliveryDay: string, purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]}) {
        try {
            await schemaDeliveryRequestPatch.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyDeliveryRequestPatchStatus(data: {status: string, reason?: string}) {
        try {
            await schemaDeliveryRequestPatchStatus.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateDeloveryRequestById(id: number,) {
        const deliveryRequest = await this.deliveryRequestRepository.findOne({where: {id}});
        if (!deliveryRequest)
            throw this.responseService.badRequest("Solicitud de entrega no encontrada.")
        return deliveryRequest;
    }
}
