import {UserRepository} from '@loopback/authentication-jwt';
import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {StatusQuotationE} from '../enums';
import {CreateQuotation, Customer, Designers, Products, ProjectManagers} from '../interface';
import {schemaCreateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {CustomerRepository, ProductRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class QuotationService {
    constructor(
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProjectManagerRepository)
        public quotationProjectManagerRepository: QuotationProjectManagerRepository,
        @repository(QuotationDesignerRepository)
        public quotationDesignerRepository: QuotationDesignerRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
        @repository(ProductRepository)
        public productRepository: ProductRepository,
        @repository(CustomerRepository)
        public customerRepository: CustomerRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(data: CreateQuotation) {
        const {id, customer, projectManagers, designers, products, quotation, isDraft} = data;
        const {isReferencedCustomer} = quotation;
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        const customerId = await this.createOrGetCustomer(customer);
        if (id === null) {
            await this.validateBodyQuotation(data);
            const bodyQuotation = {
                ...quotation,
                exchangeRateAmount: 15,
                status: StatusQuotationE.ENPROCESO,
                customerId,
                isDraft
            }
            const createQuotation = await this.quotationRepository.create(bodyQuotation);

            await this.createManyQuotition(projectManagers, designers, products, createQuotation.id)
            return createQuotation;
        } else {
            const findQuotation = await this.findQuotationById(id);
            const bodyQuotation = {
                ...quotation,
                exchangeRateAmount: 15,
                status: StatusQuotationE.ENPROCESO,
                customerId,
                isDraft
            }
            await this.quotationRepository.updateById(id, bodyQuotation)
            await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
            await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
            return this.findQuotationById(id);
        }

    }
    async findUserById(id: number) {
        const user = await this.userRepository.findOne({where: {id}})
        if (!user)
            throw this.responseService.badRequest('El cliente referido no existe.');
        return user;
    }

    async createOrGetCustomer(customer: Customer) {
        const {customerId, ...dataCustomer} = customer;
        if (customerId) {
            const findCustomer = await this.customerRepository.findOne({where: {id: customerId}});
            if (!findCustomer)
                throw this.responseService.badRequest('El cliente id no existe.')

            return findCustomer.id;
        } else {
            // const createCustomer = await this.customerRepository.create({...dataCustomer});
            const createCustomer = await this.customerRepository.create({});
            return createCustomer.id;
        }

    }

    async createManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: Products[], quotationId: number) {
        for (const element of projectManagers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user)
                await this.quotationProjectManagerRepository.create({quotationId: quotationId, userId: element.userId, commissionPercentageProjectManager: element.commissionPercentageProjectManager});
        }
        for (const element of designers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user)
                await this.quotationDesignerRepository.create({quotationId: quotationId, userId: element.userId, commissionPercentageDesigner: element.commissionPercentageDesigner});
        }
        for (const element of products) {
            const product = await this.productRepository.findOne({where: {id: element.productId}});
            if (product)
                await this.quotationProductsRepository.create({quotationId: quotationId, productId: element.productId, typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal});
        }
    }

    async deleteManyQuotation(quotation: Quotation, projectManagers: ProjectManagers[], designers: Designers[], products: Products[],) {
        const {id} = quotation;
        const projectManagersMap = projectManagers.map((value) => value.userId);
        const projectManagersDelete = quotation?.projectManagers?.filter((value) => !projectManagersMap.includes(value?.id ?? 0)) ?? []
        console.log('projectManagersDelete: ', projectManagersDelete)
        for (const element of projectManagersDelete) {
            await this.quotationRepository.projectManagers(id).unlink(element.id)
        }
        const designersMap = designers.map((value) => value.userId);
        const designersDelete = quotation.designers?.filter((value) => !designersMap.includes(value?.id ?? 0)) ?? []
        for (const element of designersDelete) {
            await this.quotationRepository.designers(id).unlink(element.id)
        }
        const productsMap = products.map((value) => value.productId);
        const productsDelete = quotation.products?.filter((value) => !productsMap.includes(value?.id ?? 0)) ?? []
        for (const element of productsDelete) {
            await this.quotationRepository.products(id).unlink(element.id)
        }
    }

    async updateManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: Products[], quotationId: number) {

        for (const element of projectManagers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const findQuotationPM = await this.quotationProjectManagerRepository.findOne({where: {quotationId: quotationId, userId: element.userId}});
                if (findQuotationPM)
                    await this.quotationProjectManagerRepository.updateById(findQuotationPM.id, {commissionPercentageProjectManager: element.commissionPercentageProjectManager});
                else
                    await this.quotationProjectManagerRepository.create({quotationId: quotationId, userId: element.userId, commissionPercentageProjectManager: element.commissionPercentageProjectManager});
            }
        }
        for (const element of designers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const findQuotationD = await this.quotationDesignerRepository.findOne({where: {quotationId: quotationId, userId: element.userId}});
                if (findQuotationD)
                    await this.quotationDesignerRepository.updateById(findQuotationD.id, {commissionPercentageDesigner: element.commissionPercentageDesigner});
                else
                    await this.quotationDesignerRepository.create({quotationId: quotationId, userId: element.userId, commissionPercentageDesigner: element.commissionPercentageDesigner});
            }
        }
        for (const element of products) {
            const product = await this.productRepository.findOne({where: {id: element.productId}});
            if (product) {
                const findQuotationP = await this.quotationProductsRepository.findOne({where: {quotationId: quotationId, productId: element.productId}});
                if (findQuotationP)
                    await this.quotationProductsRepository.updateById(findQuotationP.id, {typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal});
                else
                    await this.quotationProductsRepository.create({quotationId: quotationId, productId: element.productId, typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal});
            }
        }
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}, include: [{relation: 'projectManagers'}, {relation: 'designers'}, {relation: 'products'}]})
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation;
    }

    async validateBodyQuotation(data: CreateQuotation) {
        try {
            await schemaCreateQuotition.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async count(where?: Where<Quotation>,) {
        return this.quotationRepository.count(where);
    }

    async find(filter?: Filter<Quotation>,) {
        console.log(this.user);
        const accessLevel = this.user.accessLevel;
        const filterInclude = [
            {
                relation: 'customer',
                scope: {
                    fields: ['id',]
                }
            },
            {
                relation: 'projectManagers',
                scope: {
                    fields: ['id', 'firstName']
                }
            }
        ]
        if (filter?.include)
            filter.include = [
                ...filter.include,
                ...filterInclude
            ]
        else
            filter = {
                ...filter, include: [...filterInclude]
            };
        return (await this.quotationRepository.find(filter)).map(value => {
            const {id, customer, projectManagers, total, status, updatedAt} = value;
            // const { } = customer;
            return {
                id,
                customerName: customer.id,
                pm: projectManagers?.length > 0 ? projectManagers[0].firstName : '',
                total,
                branchName: '',
                status,
                updatedAt
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<Quotation>) {
        return this.quotationRepository.findById(id, filter);
    }

    async updateById(id: number, quotation: Quotation,) {
        await this.quotationRepository.updateById(id, quotation);
    }

    async deleteById(id: number) {
        await this.quotationRepository.deleteById(id);
    }

}
