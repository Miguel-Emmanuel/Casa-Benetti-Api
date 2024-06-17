import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Document, Product} from '../models';
import {BrandRepository, ClassificationRepository, LineRepository, ProductRepository, ProviderRepository, UserRepository} from '../repositories';
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
        @repository(BrandRepository)
        public brandRepository: BrandRepository,
        @repository(ProviderRepository)
        public providerRepository: ProviderRepository,
        @repository(ClassificationRepository)
        public classificationRepository: ClassificationRepository,
        @repository(LineRepository)
        public lineRepository: LineRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) { }

    async create(data: {product: Omit<Product, 'id'>, document: Document}) {
        try {
            const {product, document} = data;
            const {brandId, providerId, classificationId, lineId} = product;
            await this.findByIdBrand(brandId);
            await this.findByIdProvider(providerId);
            await this.findByIdClassification(classificationId);
            await this.findByIdLine(lineId);
            const response = await this.productRepository.create({...product, organizationId: this.user.organizationId});
            await this.createDocuments(response.id, document)
            return response;
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error.message ?? error)
        }
    }

    async createDocuments(productId: number, document: Document) {
        if (document) {
            await this.productRepository.document(productId).create(document);
        }
    }

    async findByIdBrand(id: number) {
        const brand = await this.brandRepository.findOne({where: {id}});
        if (!brand)
            throw this.responseService.notFound("La marca no se ha encontrado.")
    }

    async findByIdProvider(id: number) {
        const provider = await this.providerRepository.findOne({where: {id}});
        if (!provider)
            throw this.responseService.notFound("El provedor no se ha encontrado.")
    }

    async findByIdClassification(id: number) {
        const classification = await this.classificationRepository.findOne({where: {id}});
        if (!classification)
            throw this.responseService.notFound("La clasificacion no se ha encontrado.")
    }

    async findByIdLine(id: number) {
        const line = await this.lineRepository.findOne({where: {id}});
        if (!line)
            throw this.responseService.notFound("La linea no se ha encontrado.")
    }

    async findByIdProduct(id: number) {
        const product = await this.productRepository.findOne({where: {id}});
        if (!product)
            throw this.responseService.notFound("El producto no se ha encontrado.")
    }

    async count(where?: Where<Product>,) {
        return this.productRepository.count(where);
    }
    async find(filter?: Filter<Product>,) {
        const products = await this.productRepository.find(filter);
        for (let index = 0; index < products.length; index++) {
            const document = products[index].document;
            if (document) {
                const element: any = document;
                const createdBy = await this.userRepository.findByIdOrDefault(element.createdBy);
                const updatedBy = await this.userRepository.findByIdOrDefault(element.updatedBy);
                element.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
                element.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
            }
        }
        return products;
    }

    async findById(id: number, filter?: FilterExcludingWhere<Product>) {
        const product = await this.productRepository.findById(id, filter);
        const document = product?.document;
        if (document) {
            const element: any = document;
            const createdBy = await this.userRepository.findByIdOrDefault(element.createdBy);
            const updatedBy = await this.userRepository.findByIdOrDefault(element.updatedBy);
            element.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
            element.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
        }
        return product
    }
    async updateById(id: number, product: Product,) {
        const {brandId, providerId, classificationId, lineId} = product;
        await this.findByIdProduct(id);
        await this.findByIdBrand(brandId);
        await this.findByIdProvider(providerId);
        await this.findByIdClassification(classificationId);
        await this.findByIdLine(lineId);
        await this.productRepository.updateById(id, product);
    }

    async deleteById(id: number) {
        await this.productRepository.deleteById(id);
    }
}
