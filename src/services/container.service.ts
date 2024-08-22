import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import dayjs from 'dayjs';
import {ContainerStatus} from '../enums';
import {Docs, PurchaseOrdersContainer, UpdateContainer, UpdateContainerProducts} from '../interface';
import {schemaCreateContainer, schemaUpdateContainer, schemaUpdateContainerProduct} from '../joi.validation.ts/container.validation';
import {ResponseServiceBindings} from '../keys';
import {Container, ContainerCreate, Document, PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {ContainerRepository, DocumentRepository, PurchaseOrdersRepository, QuotationProductsRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ContainerService {
    constructor(
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
    ) { }

    async create(container: Omit<ContainerCreate, 'id'>,) {
        try {
            await this.validateBodyCustomer(container);
            const {docs, ...body} = container
            const containerRes = await this.containerRepository.create({...body});
            await this.createDocument(containerRes!.id, docs);
            return containerRes;
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async updateById(id: number, data: UpdateContainer,) {
        try {
            await this.validateBodyUpdate(data);
            const container = await this.containerRepository.findOne({where: {id}});
            if (!container)
                throw this.responseService.badRequest("El contenedor no existe.")
            const {docs, purchaseOrders, status, ...body} = data;
            const date = await this.calculateArrivalDateAndShippingDate(status);
            await this.containerRepository.updateById(id, {...body, ...date, status});
            await this.calculateArrivalDatePurchaseOrder(id);
            await this.updateDocument(id, docs);
            await this.updateProducts(purchaseOrders);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async updateByIdProducts(id: number, data: UpdateContainerProducts,) {
        await this.validateBodyUpdateProducts(data);
        const container = await this.containerRepository.findOne({where: {id}});
        if (!container)
            throw this.responseService.badRequest("El contenedor no existe.")
        const {purchaseOrders} = data;
        await this.updateProducts(purchaseOrders);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async calculateArrivalDatePurchaseOrder(containerId: number) {
        const include: InclusionFilter[] = [
            {
                relation: 'collection',
                scope: {
                    include: [
                        {
                            relation: 'purchaseOrders',
                        }
                    ]
                }
            }
        ]
        const container = await this.containerRepository.findById(containerId, {include});
        const {ETDDate, ETADate} = container;
        let arrivalDate;
        if (ETADate) {
            arrivalDate = dayjs(ETADate).add(10, 'days').toDate()
        }
        else if (ETDDate) {
            arrivalDate = dayjs(ETDDate).add(31, 'days').toDate()
        }
        const {collection} = container;
        if (collection && collection?.purchaseOrders) {
            const {purchaseOrders} = collection;
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                if (arrivalDate) {
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
                const {productionEndDate, productionRealEndDate} = element;
                if (productionRealEndDate) {
                    const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
                if (productionEndDate) {
                    const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
            }
        }
    }

    calculateArrivalDateAndShippingDate(status: ContainerStatus) {
        if (status === ContainerStatus.EN_TRANSITO)
            return {arrivalDate: dayjs().toDate()}
        if (status === ContainerStatus.ENTREGADO)
            return {shippingDate: dayjs().toDate()}
    }

    async updateProducts(purchaseOrders: PurchaseOrdersContainer[]) {
        for (let index = 0; index < purchaseOrders?.length; index++) {
            const {products} = purchaseOrders[index];
            for (let index = 0; index < products?.length; index++) {
                const {id, ...data} = products[index];
                await this.quotationProductsRepository.updateById(id, {...data})
            }
        }
    }

    async find(filter?: Filter<Container>,) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'collection',
                    scope: {
                        include: [
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
            const containers = await this.containerRepository.find(filter);
            return containers.map(value => {
                const {id, containerNumber, collection, arrivalDate, status, shippingDate} = value;
                let quantity = 0;
                for (let index = 0; index < collection?.purchaseOrders.length; index++) {
                    const element = collection?.purchaseOrders[index];
                    const {proforma} = element;
                    const {quotationProducts} = proforma;
                    quantity += quotationProducts?.length ?? 0;
                }
                return {
                    id,
                    containerNumber,
                    quantity,
                    shippingDate,
                    arrivalDate,
                    status
                }
            })

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async getContainerEntry() {
        try {
            const containers = await this.containerRepository.find({
                where: {
                    status: ContainerStatus.ENTREGADO
                },
                include: [
                    {
                        relation: 'purchaseOrders',
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
            });
            return containers?.map(value => {
                const {id, containerNumber, purchaseOrders, arrivalDate, status, shippingDate} = value;
                return {
                    id,
                    containerNumber,
                    status,
                    purchaseOrders: purchaseOrders?.map(value => {
                        const {id, quotationProducts} = value;
                        return {
                            id,
                            quotationProducts: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                                const {id: productId, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, } = value;
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
                                    image: document?.fileURL,
                                    description,
                                }
                            })
                        }
                    })
                }
            })

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async findById(id: number, filter?: FilterExcludingWhere<Container>) {
        try {
            const include: InclusionFilter[] = [
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
                },
                {
                    relation: 'documents'
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
            const container = await this.containerRepository.findById(id, filter);
            const {pedimento, containerNumber, grossWeight, numberBoxes, measures, status, arrivalDate, shippingDate, ETDDate, ETADate, invoiceNumber, documents, purchaseOrders} = container;
            return {
                pedimento,
                containerNumber,
                grossWeight,
                numberBoxes,
                measures,
                status,
                invoiceNumber,
                arrivalDate: arrivalDate ?? 'Pendiente',
                shippingDate: shippingDate ?? 'Pendiente',
                ETDDate: ETDDate ?? 'Pendiente',
                ETADate: ETADate ?? 'Pendiente',
                docs: documents?.map(value => {
                    const {id, fileURL, name, extension} = value;
                    return {
                        id,
                        fileURL,
                        name, extension
                    }
                }),
                purchaseOrders: purchaseOrders ? purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                    const {id: purchaseOrderid, proforma} = value;
                    const {quotationProducts} = proforma;
                    return {
                        id: purchaseOrderid,
                        products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, invoiceNumber, grossWeight, netWeight, numberBoxes, NOMS, descriptionPedimiento} = value;
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
                                descriptionPedimiento,
                                invoiceNumber,
                                grossWeight,
                                netWeight,
                                numberBoxes,
                                NOMS
                            }
                        })
                    }
                }) : [],
            }
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async validateContainerById(id: number) {
        const container = await this.containerRepository.findOne({where: {id}});
        if (!container)
            throw this.responseService.badRequest("El contenedor no existe.");

        return container;
    }


    async validateBodyCustomer(customer: ContainerCreate) {
        try {
            await schemaCreateContainer.validateAsync(customer);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyUpdate(data: UpdateContainer,) {
        try {
            await schemaUpdateContainer.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }
    async validateBodyUpdateProducts(data: UpdateContainerProducts,) {
        try {
            await schemaUpdateContainerProduct.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async createDocument(containerId?: number, documents?: Document[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.containerRepository.documents(containerId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }

    async updateDocument(containerId?: number, documents?: Docs[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.containerRepository.documents(containerId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }
}
