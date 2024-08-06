import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {schemaCollectionCreate} from '../joi.validation.ts/collection.validation';
import {ResponseServiceBindings} from '../keys';
import {Collection} from '../models';
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
