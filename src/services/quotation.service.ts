import {UserRepository} from '@loopback/authentication-jwt';
import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE, StatusQuotationE} from '../enums';
import {CreateQuotation, Customer, Designers, DesignersById, Products, ProductsById, ProjectManagers, ProjectManagersById, QuotationFindOneResponse, QuotationI, UpdateQuotation} from '../interface';
import {schemaCreateQuotition, schemaUpdateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {Quotation} from '../models';
import {CustomerRepository, GroupRepository, ProductRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository} from '../repositories';
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
        @repository(GroupRepository)
        public groupRepository: GroupRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(data: CreateQuotation) {
        const {id, customer, projectManagers, designers, products, quotation, isDraft} = data;
        const {isReferencedCustomer} = quotation;
        //Falta agregar validacion para saber cuando es borrador o no
        await this.validateBodyQuotation(data);
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        const groupId = await this.createOrGetGroup(customer);
        const customerId = await this.createOrGetCustomer({...customer}, groupId);
        const userId = this.user.id;
        try {
            if (id === null) {
                const branchId = this.user.branchId;
                const createQuotation = await this.createQuatation(quotation, isDraft, customerId, userId, branchId);
                await this.createManyQuotition(projectManagers, designers, products, createQuotation.id)
                return createQuotation;
            } else {
                const findQuotation = await this.findQuotationById(id);
                await this.updateQuotation(quotation, isDraft, customerId, userId, id);
                await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
                await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
                return this.findQuotationById(id);
            }
        } catch (error) {
            if (customerId)
                await this.customerRepository.deleteById(customerId);
            if (groupId)
                await this.groupRepository.deleteById(groupId);
            throw this.responseService.badRequest(error?.message ? error?.message : error);
        }

    }

    async updateQuotation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, quotationId: number) {
        const bodyQuotation = {
            ...quotation,
            exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            userId
        }
        await this.quotationRepository.updateById(quotationId, bodyQuotation)
    }

    async createQuatation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, branchId: number) {
        const bodyQuotation = {
            ...quotation,
            exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            branchId,
            userId
        }
        return this.quotationRepository.create(bodyQuotation);
    }
    async findUserById(id: number) {
        const user = await this.userRepository.findOne({where: {id}})
        if (!user)
            throw this.responseService.badRequest('El cliente referido no existe.');
        return user;
    }

    async createOrGetCustomer(customer: Customer, groupId: number | undefined) {
        const {customerId, groupName, ...dataCustomer} = customer;
        if (customerId) {
            const findCustomer = await this.customerRepository.findOne({where: {id: customerId}});
            if (!findCustomer)
                throw this.responseService.badRequest('El cliente id no existe.')

            return findCustomer.id;
        } else {
            const createCustomer = await this.customerRepository.create({...dataCustomer, organizationId: this.user.organizationId, groupId: groupId});
            return createCustomer.id;
        }

    }


    async createOrGetGroup(customer: Customer) {
        const {groupId, groupName} = customer;
        if (groupId) {
            const findGroup = await this.groupRepository.findOne({where: {id: groupId}});
            if (!findGroup)
                throw this.responseService.badRequest('El grupo no existe.')

            return findGroup.id;
        } else {
            if (groupName) {
                const createGroup = await this.groupRepository.create({name: groupName, organizationId: this.user.organizationId});
                return createGroup.id;
            }
        }
        return undefined;

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
                await this.quotationProductsRepository.create({quotationId: quotationId, productId: element.productId, typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal, additionalDiscount: element.additionalDiscount, discountProduct: element.discountProduct});
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
                    await this.quotationProductsRepository.updateById(findQuotationP.id, {typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal, additionalDiscount: element.additionalDiscount, discountProduct: element.discountProduct});
                else
                    await this.quotationProductsRepository.create({quotationId: quotationId, productId: element.productId, typeSale: element.typeSale, isSeparate: element.isSeparate, percentageSeparate: element.percentageSeparate, reservationDays: element.reservationDays, quantity: element.quantity, percentageDiscountProduct: element.percentageDiscountProduct, percentageAdditionalDiscount: element.percentageAdditionalDiscount, subtotal: element.subtotal, additionalDiscount: element.additionalDiscount, discountProduct: element.discountProduct});
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

    async validateBodyQuotationUpdate(data: UpdateQuotation) {
        try {
            await schemaUpdateQuotition.validateAsync(data);
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
        let where = {};
        if (accessLevel === AccessLevelRolE.SUCURSAL) {
            where = {branchId: this.user.branchId}
        }

        if (accessLevel === AccessLevelRolE.PERSONAL) {
            const quotationProjectManagers = (await this.quotationProjectManagerRepository.find({where: {userId: this.user.id}})).map(value => value.quotationId);
            where = {id: {inq: [...quotationProjectManagers]}}
        }

        if (filter?.where) {
            filter.where = {...filter.where, ...where}
        } else {
            filter = {...filter, where: {...where}};
        }
        const filterInclude = [
            {
                relation: 'customer',
                scope: {
                    fields: ['id', 'name']
                }
            },
            {
                relation: 'projectManagers',
                scope: {
                    fields: ['id', 'firstName', 'lastName']
                }
            },
            {
                relation: 'branch',
            },
            {
                relation: 'projectManager',
            },
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
            const {id, customer, projectManagers, total, status, updatedAt, branch, projectManager} = value;
            const {name} = customer;
            return {
                id,
                customerName: name,
                pm: projectManager ? `${projectManager?.firstName} ${projectManager?.lastName ?? ''}` : '',
                pmId: projectManager ? projectManager?.id : '',
                branchId: branch?.id,
                total,
                branchName: branch?.name,
                status,
                updatedAt
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<Quotation>): Promise<QuotationFindOneResponse> {
        const filterInclude = [
            {
                relation: 'customer',
            },
            {
                relation: 'products',
                scope: {
                    include: ['quotationProducts', 'brand', 'document']
                }

            },
            {
                relation: 'projectManagers',
                scope: {
                    fields: ['id', 'firstName'],
                    include: ['quotationPM']
                }
            },
            {
                relation: 'designers',
                scope: {
                    fields: ['id', 'firstName'],
                    include: ['quotationDe']
                }
            },
            {
                relation: 'referenceCustomer'
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
        const quotation = await this.quotationRepository.findById(id, filter);
        const products: ProductsById[] = [];
        const projectManagers: ProjectManagersById[] = [];
        const designers: DesignersById[] = [];
        for (const iterator of quotation?.products ?? []) {
            products.push({
                ...iterator,
                SKU: iterator.SKU,
                brandName: iterator?.brand?.brandName ?? '',
                status: iterator.status,
                description: iterator.description,
                image: iterator?.document ? iterator?.document?.fileURL : '',
                mainFinish: iterator.mainFinish,
                sale: iterator.quotationProducts.typeSale ?? '',
                quantity: iterator.quotationProducts.quantity,
                percentageDiscountProduct: iterator.quotationProducts.percentageDiscountProduct,
                discountProduct: iterator.quotationProducts.discountProduct,
                percentageAdditionalDiscount: iterator.quotationProducts.percentageAdditionalDiscount,
                additionalDiscount: iterator.quotationProducts.additionalDiscount,
                subtotal: iterator.quotationProducts.subtotal,
            })
        }

        for (const iterator of quotation?.projectManagers ?? []) {
            projectManagers.push({
                id: iterator.id,
                projectManagerName: iterator.firstName,
                commissionPercentageProjectManager: iterator.quotationPM.commissionPercentageProjectManager,
            })
        }

        for (const iterator of quotation?.designers ?? []) {
            designers.push({
                id: iterator.id,
                designerName: iterator.firstName,
                commissionPercentageDesigner: iterator.quotationDe.commissionPercentageDesigner,
            })
        }

        const response: QuotationFindOneResponse = {
            customer: {
                customerId: quotation.customerId,
                firstName: quotation.customer.name,
                lastName: quotation.customer.lastName,
                secondLastName: quotation.customer.secondLastName,
                address: quotation.customer?.address,
                addressDescription: quotation.customer?.addressDescription,
                phone: quotation.customer.phone,
                invoice: quotation.customer.invoice,
                rfc: quotation.customer.rfc,
                businessName: quotation.customer.businessName,
                regimen: quotation.customer.regimen,
                group: quotation?.customer?.group?.name,
                groupId: quotation?.customer?.groupId
            },
            products: products,
            quotation: {
                subtotal: quotation.subtotal,
                additionalDiscount: quotation.additionalDiscount,
                percentageIva: quotation.percentageIva,
                iva: quotation.iva,
                total: quotation.total,
                advance: quotation.advance,
                exchangeRate: quotation.exchangeRate,
                balance: quotation.balance,
                isArchitect: quotation.isArchitect,
                architectName: quotation.architectName,
                commissionPercentageArchitect: quotation.commissionPercentageArchitect,
                isReferencedCustomer: quotation.isReferencedCustomer,
                referenceCustomerId: quotation.referenceCustomerId,
                commissionPercentagereferencedCustomer: quotation.commissionPercentagereferencedCustomer,
                percentageAdditionalDiscount: quotation?.percentageAdditionalDiscount,
                advanceCustomer: quotation?.advanceCustomer,
                conversionAdvance: quotation?.conversionAdvance,

            },
            commisions: {
                architectName: quotation.architectName,
                commissionPercentageArchitect: quotation.commissionPercentageArchitect,
                referencedCustomerName: quotation?.referenceCustomer?.firstName,
                projectManagers: projectManagers,
                designers: designers
            }
        }
        return response
    }

    async updateById(id: number, data: UpdateQuotation,) {
        const {customer, projectManagers, designers, products, quotation, isDraft} = data;
        const {isReferencedCustomer} = quotation;
        await this.validateBodyQuotationUpdate(data);
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        const groupId = await this.createOrGetGroup(customer);
        const customerId = await this.createOrGetCustomer({...customer}, groupId);
        const userId = this.user.id;
        const findQuotation = await this.findQuotationById(id);
        await this.updateQuotation(quotation, isDraft, customerId, userId, id);
        await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
        await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
        return this.findQuotationById(id);
    }

    async deleteById(id: number) {
        await this.quotationRepository.deleteById(id);
    }

    async changeStatusToReviewAdmin(id: number) {
        await this.findQuotationById(id);
        await this.quotationRepository.updateById(id, {status: StatusQuotationE.ENREVISIONADMINSITRACION});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

}
