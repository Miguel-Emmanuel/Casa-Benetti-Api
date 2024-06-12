import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Product} from '../models';
import {ProductRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProductService {
    constructor(
        @repository(ProductRepository)
        public productRepository: ProductRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(product: Omit<Product, 'id'>,) {
        try {
            return await this.productRepository.create(product);
        } catch (error) {
            throw this.responseService.badRequest(error.message ?? error)
        }
    }

    async count(where?: Where<Product>,) {
        return this.productRepository.count(where);
    }
    async find(filter?: Filter<Product>,) {
        return this.productRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<Product>) {
        return this.productRepository.findById(id, filter);
    }
    async updateById(id: number, product: Product,) {
        await this.productRepository.updateById(id, product);
    }

    async deleteById(id: number) {
        await this.productRepository.deleteById(id);
    }
}
