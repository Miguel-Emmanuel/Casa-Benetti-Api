import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {CollectionDestinationE, PurchaseOrdersStatus, QuotationProductStatusE} from '../enums';
import {schemaCollectionCreate, schemaCollectionPatchFeedback} from '../joi.validation.ts/collection.validation';
import {ResponseServiceBindings} from '../keys';
import {Collection, PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {CollectionRepository, DocumentRepository, PurchaseOrdersRepository, QuotationProductsRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CollectionService {
    constructor(
        @repository(CollectionRepository)
        public collectionRepository: CollectionRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
    ) { }

    async earringsCollect() {
        const include: InclusionFilter[] = [
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
        const purchaseOrders = await this.purchaseOrdersRepository.find({
            where: {
                and: [
                    {
                        status: PurchaseOrdersStatus.EN_RECOLECCION
                    },
                    {
                        collectionId: {eq: null}
                    }
                ]
            }, include: [...include]
        })

        return purchaseOrders.map(value => {
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
                    }
                })
            }
        })
    }

    async create(collection: {destination: string, dateCollection: Date, purchaseOrders: number[]}) {
        await this.validateCollectionBody(collection)
        const {purchaseOrders, ...body} = collection;
        const collectionRes = await this.collectionRepository.create(body);
        await this.relationCollectionToPurchaseOrders(collectionRes.id, purchaseOrders);
        return collectionRes
    }

    async updateById(id: number, collection: {destination: string, dateCollection: Date, purchaseOrders: number[]}) {
        await this.validateCollectionById(id);
        await this.validateCollectionBody(collection)
        const {purchaseOrders, ...body} = collection;
        await this.collectionRepository.updateById(id, body);
        await this.relationCollectionToPurchaseOrders(id, purchaseOrders);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async find(filter?: Filter<Collection>,) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'purchaseOrders',
                    scope: {
                        fields: ['id', 'collectionId', 'proformaId'],
                        include: [
                            {
                                relation: 'proforma',
                                scope: {
                                    fields: ['id', 'providerId'],
                                    include: [
                                        {
                                            relation: 'provider'
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

            const collectios = await this.collectionRepository.find(filter);
            return collectios?.map(value => {
                const {id, dateCollection, purchaseOrders} = value;
                return {
                    id,
                    dateCollection,
                    providers: purchaseOrders?.map(value => value?.proforma?.provider?.name)?.join(', ')
                }
            })
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async findById(id: number, filter?: FilterExcludingWhere<Collection>) {
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
                                        },
                                        {
                                            relation: 'provider'
                                        },
                                        {
                                            relation: 'brand'
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
            const collection = await this.collectionRepository.findById(id, filter);
            const {purchaseOrders, destination, dateCollection} = collection;
            return {
                id,
                destination,
                dateCollection,
                purchaseOrders: purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                    const {id: purchaseOrderid, proforma, productionEndDate} = value;
                    const {proformaId, provider, brand, quotationProducts} = proforma;
                    const {name} = provider;
                    const {brandName} = brand;
                    return {
                        id: purchaseOrderid,
                        proformaId,
                        provider: name,
                        brand: brandName,
                        quantity: quotationProducts?.length ?? 0,
                        productionEndDate,
                        products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
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
                            }
                        })
                    }
                }),
            };
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    //

    async relationCollectionToPurchaseOrders(collectionId: number, purchaseOrders: number[]) {
        for (let index = 0; index < purchaseOrders.length; index++) {
            const element = purchaseOrders[index];
            const purchaseOrder = await this.purchaseOrdersRepository.findOne({where: {id: element}});
            if (purchaseOrder)
                await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {collectionId})
        }
    }

    async validateCollectionBody(collection: {destination: string, dateCollection: Date, purchaseOrders: number[]}) {
        try {
            await schemaCollectionCreate.validateAsync(collection);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateCollectionById(id: number,) {
        const collection = await this.collectionRepository.findOne({where: {id}});
        if (!collection)
            throw this.responseService.badRequest("Recoleccion no encontrada.")
        return collection;
    }

    async validateBodyCollectionPatchFeedback(data: {destination: CollectionDestinationE, dateCollection: Date, containerNumber: string, documents: {fileURL: string, name: string, extension: string, id?: number}[]}) {
        try {
            await schemaCollectionPatchFeedback.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async setFeedback(id: number, data: {destination: CollectionDestinationE, dateCollection: Date, containerNumber: string, documents: {fileURL: string, name: string, extension: string, id?: number}[]}) {
        await this.validateCollectionById(id);
        await this.validateBodyCollectionPatchFeedback(data);
        const {containerNumber, documents, destination, dateCollection} = data;
        await this.collectionRepository.updateById(id, {containerNumber, destination, dateCollection})
        await this.createDocument(id, documents);
        await this.validaIfContainer(id, destination);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async validaIfContainer(collectionId: number, destination: CollectionDestinationE) {
        if (destination === CollectionDestinationE.CONTENEDOR) {
            const collection = await this.collectionRepository.findById(collectionId, {
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
            });
            const {purchaseOrders} = collection;
            for (let index = 0; index < purchaseOrders?.length; index++) {
                const element = purchaseOrders[index];
                const {id: purchaseOrderid, proforma} = element;
                const {quotationProducts} = proforma;
                await this.purchaseOrdersRepository.updateById(purchaseOrderid, {status: PurchaseOrdersStatus.TRANSITO_INTERNACIONAL});
                for (let index = 0; index < quotationProducts?.length; index++) {
                    const element = quotationProducts[index];
                    const {id: quotationProductId} = element;
                    await this.quotationProductsRepository.updateById(quotationProductId, {status: QuotationProductStatusE.TRANSITO_INTERNACIONAL});
                }
            }
        }
    }

    async createDocument(collectionId: number, documents?: {fileURL: string, name: string, extension: string, id?: number}[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.collectionRepository.documents(collectionId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }
}
