import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
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
        return this.collectionRepository.create(body);
    }

    async find(filter?: Filter<Collection>,) {
        return this.collectionRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<Collection>) {
        return this.collectionRepository.findById(id, filter);
    }

    async updateById(id: number, collection: Collection,) {
        await this.collectionRepository.updateById(id, collection);
    }

    //

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
