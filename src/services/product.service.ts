import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {schemaActivateDeactivate, schemaCreateProduct, schemaUpdateProforma} from '../joi.validation.ts/product.validation';
import {ResponseServiceBindings} from '../keys';
import {AssembledProducts, Document, Product, ProductCreate, ProductProvider} from '../models';
import {AssembledProductsRepository, BrandRepository, ClassificationRepository, DocumentRepository, LineRepository, ProductProviderRepository, ProductRepository, ProviderRepository, UserRepository} from '../repositories';
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
        @repository(AssembledProductsRepository)
        public assembledProductsRepository: AssembledProductsRepository,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(ProductProviderRepository)
        public productProviderRepository: ProductProviderRepository
    ) { }

    async create(data: {product: Omit<ProductCreate, 'id'>, document: Document, assembledProducts: {assembledProduct: AssembledProducts, document: Document}[]}) {
        await this.validateBodyProduct(data);
        try {
            const {product, document, assembledProducts} = data;
            const {brandId, classificationId, lineId, providersInformation} = product;
            await this.findByIdBrand(brandId);
            await this.findByIdClassification(classificationId);
            await this.findByIdLine(lineId);
            await this.validateProviderInProviderProducst(providersInformation);
            delete product.providersInformation;
            const response = await this.productRepository.create({...product, organizationId: this.user.organizationId});
            await this.createAssembledProducts(assembledProducts, response.id);
            await this.createDocument(response.id, document)
            await this.createProviderProducts(response.id, providersInformation);
            return response;
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error.message ?? error)
        }
    }

    async validateProviderInProviderProducst(providersInformation: ProductProvider[] = []) {
        for (let index = 0; index < providersInformation?.length; index++) {
            const {providerId, } = providersInformation[index];
            const provider = await this.providerRepository.findOne({where: {id: providerId}})
            if (!provider)
                throw this.responseService.badRequest('El proveedor no existe.')
        }
    }

    async createProviderProducts(productId: number, providersInformation: ProductProvider[] = []) {
        for (let index = 0; index < providersInformation?.length; index++) {
            const {providerId, model, originCode, originCost, currency} = providersInformation[index];
            await this.productProviderRepository.create({providerId, productId, model, originCode, originCost, currency})
        }
    }

    async createAssembledProducts(assembledProducts: {assembledProduct: AssembledProducts, document: Document}[], productId: number) {
        for (let index = 0; index < assembledProducts?.length; index++) {
            const {assembledProduct, document} = assembledProducts[index];
            const assembledProductRes = await this.assembledProductsRepository.create({...assembledProduct, productId});
            await this.createDocumentAssembledProduct(assembledProductRes.id, document)
        }
    }

    async createDocumentAssembledProduct(assembledId: number, document: Document) {
        if (document) {
            await this.assembledProductsRepository.document(assembledId).create(document);
        }
    }

    async validateBodyProduct(data: {product: Omit<ProductCreate, 'id'>, document: Document}) {
        try {
            await schemaCreateProduct.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async createDocument(productId: number, document: Document) {
        if (document && !document?.id) {
            await this.productRepository.document(productId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async findByIdBrand(id?: number) {
        const brand = await this.brandRepository.findOne({where: {id}});
        if (!brand)
            throw this.responseService.notFound("La marca no se ha encontrado.")
    }

    async findByIdProvider(id?: number) {
        const provider = await this.providerRepository.findOne({where: {id}});
        if (!provider)
            throw this.responseService.notFound("El provedor no se ha encontrado.")
    }

    async findByIdClassification(id?: number) {
        const classification = await this.classificationRepository.findOne({where: {id}});
        if (!classification)
            throw this.responseService.notFound("La clasificacion no se ha encontrado.")
    }

    async findByIdLine(id?: number) {
        const line = await this.lineRepository.findOne({where: {id}});
        if (!line)
            throw this.responseService.notFound("La linea no se ha encontrado.")
    }

    async findByIdProduct(id: number) {
        const product = await this.productRepository.findOne({where: {id}});
        if (!product)
            throw this.responseService.notFound("El producto no se ha encontrado.")
        return product
    }

    async count(where?: Where<Product>,) {
        return this.productRepository.count(where);
    }
    async find(filter?: Filter<Product>,) {
        const include = [
            {
                relation: 'document',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'createdBy', 'updatedBy', 'id']
                }
            },
            {
                relation: 'brand',
                scope: {
                    fields: ['brandName', 'id',]
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
        const include = [
            {
                relation: 'mainMaterialImage',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id']
                }

            },
            {
                relation: 'mainFinishImage',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id']
                }
            },
            {
                relation: 'secondaryMaterialImage',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id']
                }
            },
            {
                relation: 'secondaryFinishingImage',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id']
                }
            },
            {
                relation: 'document',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'createdBy', 'updatedBy', 'id']
                }
            },
            {
                relation: 'assembledProducts',
                scope: {
                    include: [
                        {
                            relation: 'document',
                            scope: {
                                fields: ['fileURL', 'name', 'extension', 'id']
                            }
                        },
                    ]
                }
            },
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
    async updateById(id: number, data: {product: Omit<ProductCreate, 'id'>, document: Document, assembledProducts: {assembledProduct: AssembledProducts, document: Document}[]}) {
        await this.validateBodyProduct(data);
        const {product, document, assembledProducts, } = data;
        const {brandId, classificationId, lineId} = product;
        await this.findByIdProduct(id);
        await this.findByIdBrand(brandId);
        await this.findByIdClassification(classificationId);
        await this.findByIdLine(lineId);
        await this.createDocument(id, document)
        await this.updateAssembledProducts(assembledProducts, id);
        await this.productRepository.updateById(id, product);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async updateAssembledProducts(assembledProducts: {assembledProduct: AssembledProducts, document: Document}[], productId: number) {
        for (let index = 0; index < assembledProducts?.length; index++) {
            const {assembledProduct, document} = assembledProducts[index];
            if (assembledProduct && !assembledProduct?.id) {
                const assembledProductRes = await this.assembledProductsRepository.create({...assembledProduct, productId});
                await this.updateDocumentAssembledProduct(assembledProductRes?.id, document)
            } else if (assembledProduct && assembledProduct?.id) {
                this.assembledProductsRepository.updateById(assembledProduct?.id, {...assembledProduct});
                await this.updateDocumentAssembledProduct(assembledProduct?.id, document)
            }
        }
    }

    async updateDocumentAssembledProduct(assembledId: number, document: Document) {
        if (!document?.id) {
            await this.assembledProductsRepository.document(assembledId).create(document);
        } else {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async deleteById(id: number) {
        await this.productRepository.deleteById(id);
    }

    async activateDeactivate(id: number, body: {activateDeactivateComment: string},) {
        const product = await this.findByIdProduct(id);
        await this.validateBodyActivateDeactivate(body);
        await this.productRepository.updateById(id, {isActive: !product?.isActive, activateDeactivateComment: body.activateDeactivateComment});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async validateBodyProforma(body: {price: number}) {
        try {
            await schemaUpdateProforma.validateAsync(body);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyActivateDeactivate(body: {activateDeactivateComment: string},) {
        try {
            await schemaActivateDeactivate.validateAsync(body);
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
