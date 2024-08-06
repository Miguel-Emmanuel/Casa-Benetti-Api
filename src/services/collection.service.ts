import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {PurchaseOrdersStatus} from '../enums';
import {schemaCollectionCreate} from '../joi.validation.ts/collection.validation';
import {ResponseServiceBindings} from '../keys';
import {Collection, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {CollectionRepository, PurchaseOrdersRepository} from '../repositories';
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
    ) { }

    async earringsCollect() {
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
            }
        ]
        const purchaseOrders = await this.purchaseOrdersRepository.find({
            where: {
                and: [
                    {
                        status: PurchaseOrdersStatus.EN_RECOLECCION
                    },
                    {
                        collectionId: {eq: undefined}
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

    async find(filter?: Filter<Collection>,) {
        const include: InclusionFilter[] = [
            {
                relation: 'purchaseOrders',
                scope: {
                    fields: ['id', 'collectionId']
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
        return this.collectionRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<Collection>) {
        const include: InclusionFilter[] = [
            {
                relation: 'purchaseOrders',
                scope: {
                    fields: ['id', 'collectionId']
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
        return this.collectionRepository.findById(id, filter);
    }

    async updateById(id: number, collection: Collection,) {
        await this.collectionRepository.updateById(id, collection);
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
}
