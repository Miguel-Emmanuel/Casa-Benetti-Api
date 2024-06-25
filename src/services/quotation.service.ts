import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import {AccessLevelRolE, ExchangeRateE, ExchangeRateQuotationE, StatusQuotationE} from '../enums';
import {CreateQuotation, Customer, Designers, DesignersById, Products, ProductsById, ProjectManagers, ProjectManagersById, QuotationFindOneResponse, QuotationI, UpdateQuotation} from '../interface';
import {schemaChangeStatusClose, schemaChangeStatusSM, schemaCreateQuotition, schemaUpdateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {ProofPaymentQuotationCreate, Quotation} from '../models';
import {CustomerRepository, GroupRepository, ProductRepository, ProofPaymentQuotationRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository, UserRepository} from '../repositories';
import {ProjectService} from './project.service';
import {ProofPaymentQuotationService} from './proof-payment-quotation.service';
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
        @repository(ProofPaymentQuotationRepository)
        public proofPaymentQuotationRepository: ProofPaymentQuotationRepository,
        @service()
        public proofPaymentQuotationService: ProofPaymentQuotationService,
        @service()
        public projectService: ProjectService
    ) { }

    async create(data: CreateQuotation) {
        const {id, customer, projectManagers, designers, products, quotation, isDraft, proofPaymentQuotation} = data;
        const {isReferencedCustomer, mainProjectManagerId} = quotation;
        //Falta agregar validacion para saber cuando es borrador o no
        await this.validateBodyQuotation(data);
        await this.validateMainPMAndSecondary(mainProjectManagerId, projectManagers);
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        let groupId = null;
        let customerId = null;
        try {
            groupId = await this.createOrGetGroup(customer);
            customerId = await this.createOrGetCustomer({...customer}, groupId);
            const userId = this.user.id;
            if (id === null || id == undefined) {
                const branchId = this.user.branchId;
                const createQuotation = await this.createQuatation(quotation, isDraft, customerId, userId, branchId);
                await this.createProofPayments(proofPaymentQuotation, createQuotation.id);
                await this.createManyQuotition(projectManagers, designers, products, createQuotation.id)
                return createQuotation;
            } else {
                const findQuotation = await this.findQuotationById(id);
                await this.updateQuotation(quotation, isDraft, customerId, userId, id);
                await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
                await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
                await this.updateProofPayments(proofPaymentQuotation, id);
                return this.findQuotationById(id);
            }
        } catch (error) {
            if (customer?.name && customerId) {
                await this.userRepository.deleteById(customerId);
            }
            throw this.responseService.badRequest(error?.message ? error?.message : error);
        }

    }

    async createProofPayments(proofPaymentQuotation: ProofPaymentQuotationCreate[], quotationId: number) {
        for (let index = 0; index < proofPaymentQuotation?.length; index++) {
            const element = proofPaymentQuotation[index];
            element.quotationId = quotationId;
            await this.proofPaymentQuotationService.create(element)
        }
    }

    async updateProofPayments(proofPaymentQuotation: ProofPaymentQuotationCreate[], quotationId: number) {
        for (let index = 0; index < proofPaymentQuotation?.length; index++) {
            const element = proofPaymentQuotation[index];
            element.quotationId = quotationId;
            if (element?.id) {
                await this.proofPaymentQuotationService.updateById(element?.id, element)
            } else {
                await this.proofPaymentQuotationService.create(element)
            }
        }
    }
    async validateMainPMAndSecondary(mainProjectManagerId: number, projectManagers: ProjectManagers[]) {
        const someProjectManager = projectManagers?.some(value => value.userId == mainProjectManagerId);
        if (someProjectManager === true)
            throw this.responseService.badRequest("El project manager principal se encuentra dentro de los project managers secundarios.");
    }

    async updateQuotation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, quotationId: number) {
        const data = this.convertExchangeRateQuotation(quotation);
        const bodyQuotation = {
            ...data,
            // exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            userId
        }
        await this.quotationRepository.updateById(quotationId, bodyQuotation)
    }

    async createQuatation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, branchId: number) {
        const data = this.convertExchangeRateQuotation(quotation);
        console.log('createQuatation: ', data)
        const bodyQuotation = {
            ...data,
            // exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            branchId,
            userId
        }
        return this.quotationRepository.create(bodyQuotation);
    }

    convertExchangeRateQuotation(quotation: QuotationI) {
        const {exchangeRateQuotation, subtotal, percentageAdditionalDiscount, additionalDiscount, percentageIva, iva, total, percentageAdvance, advance, exchangeRate, advanceCustomer, conversionAdvance, balance, ...data} = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const body = {
                subtotalEUR: subtotal,
                percentageAdditionalDiscountEUR: percentageAdditionalDiscount,
                additionalDiscountEUR: additionalDiscount,
                percentageIva: percentageIva,
                ivaEUR: iva,
                totalEUR: total,
                percentageAdvanceEUR: percentageAdvance,
                advanceEUR: advance,
                exchangeRateEUR: exchangeRate,
                exchangeRateAmountEUR: 15,
                advanceCustomerEUR: advanceCustomer,
                conversionAdvanceEUR: conversionAdvance,
                balanceEUR: balance,
                exchangeRateQuotation,
                ...data
            }
            return body;
        }
        if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const body = {
                subtotalMXN: subtotal,
                percentageAdditionalDiscountMXN: percentageAdditionalDiscount,
                additionalDiscountMXN: additionalDiscount,
                percentageIva: percentageIva,
                ivaMXN: iva,
                totalMXN: total,
                percentageAdvanceMXN: percentageAdvance,
                advanceMXN: advance,
                exchangeRateMXN: exchangeRate,
                exchangeRateAmountMXN: 15,
                advanceCustomerMXN: advanceCustomer,
                conversionAdvanceMXN: conversionAdvance,
                balanceMXN: balance,
                exchangeRateQuotation,
                ...data
            }
            return body;
        }
        if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const body = {
                subtotalUSD: subtotal,
                percentageAdditionalDiscountUSD: percentageAdditionalDiscount,
                additionalDiscountUSD: additionalDiscount,
                percentageIva: percentageIva,
                ivaUSD: iva,
                totalUSD: total,
                percentageAdvanceUSD: percentageAdvance,
                advanceUSD: advance,
                exchangeRateUSD: exchangeRate,
                exchangeRateAmountUSD: 15,
                advanceCustomerUSD: advanceCustomer,
                conversionAdvanceUSD: conversionAdvance,
                balanceUSD: balance,
                exchangeRateQuotation,
                ...data
            }
            return body;
        }
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
            console.log(customerId)
            if (!findCustomer)
                throw this.responseService.badRequest('El cliente id no existe.')

            return findCustomer.id;
        } else {
            console.log
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

    async findQuotationAndProductsById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}, include: [{relation: 'products'}]})
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
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
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
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async count(where?: Where<Quotation>,) {
        return this.quotationRepository.count(where);
    }

    async find(filter?: Filter<Quotation>,) {
        const accessLevel = this.user.accessLevel;
        let where: any = {status: {neq: StatusQuotationE.CERRADA}};
        if (accessLevel === AccessLevelRolE.SUCURSAL) {
            where = {...where, branchId: this.user.branchId}
        }

        if (accessLevel === AccessLevelRolE.PERSONAL) {
            const quotationProjectManagers = (await this.quotationProjectManagerRepository.find({where: {userId: this.user.id}})).map(value => value.quotationId);
            where = {...where, id: {inq: [...quotationProjectManagers]}}
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
            const {id, customer, projectManagers, exchangeRateQuotation, status, updatedAt, branch, projectManager} = value;
            const {name} = customer;
            const {total} = this.getPricesQuotation(value);
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

    getPricesQuotation(quotation: Quotation) {
        const {exchangeRateQuotation, } = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const {subtotalEUR, percentageAdditionalDiscountEUR, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, exchangeRateEUR, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR} = quotation
            const body = {
                subtotal: subtotalEUR,
                percentageAdditionalDiscount: percentageAdditionalDiscountEUR,
                additionalDiscount: additionalDiscountEUR,
                percentageIva: percentageIva,
                iva: ivaEUR,
                total: totalEUR,
                percentageAdvance: percentageAdvanceEUR,
                advance: advanceEUR,
                exchangeRate: exchangeRateEUR,
                exchangeRateAmountEUR: 15,
                advanceCustomer: advanceCustomerEUR,
                conversionAdvance: conversionAdvanceEUR,
                balance: balanceEUR,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscountUSD, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, exchangeRateUSD, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD} = quotation
            const body = {
                subtotal: subtotalUSD,
                percentageAdditionalDiscount: percentageAdditionalDiscountUSD,
                additionalDiscount: additionalDiscountUSD,
                percentageIva: percentageIva,
                iva: ivaUSD,
                total: totalUSD,
                percentageAdvance: percentageAdvanceUSD,
                advance: advanceUSD,
                exchangeRate: exchangeRateUSD,
                exchangeRateAmountUSD: 15,
                advanceCustomer: advanceCustomerUSD,
                conversionAdvance: conversionAdvanceUSD,
                balance: balanceUSD,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscountMXN, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, exchangeRateMXN, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN} = quotation
            const body = {
                subtotal: subtotalMXN,
                percentageAdditionalDiscount: percentageAdditionalDiscountMXN,
                additionalDiscount: additionalDiscountMXN,
                percentageIva: percentageIva,
                iva: ivaMXN,
                total: totalMXN,
                percentageAdvance: percentageAdvanceMXN,
                advance: advanceMXN,
                exchangeRate: exchangeRateMXN,
                exchangeRateAmountMXN: 15,
                advanceCustomer: advanceCustomerMXN,
                conversionAdvance: conversionAdvanceMXN,
                balance: balanceMXN,
            }
            return body;
        }
        const body = {
            subtotal: null,
            percentageAdditionalDiscount: null,
            additionalDiscount: null,
            percentageIva: null,
            iva: null,
            total: null,
            percentageAdvance: null,
            advance: null,
            exchangeRate: null,
            exchangeRateAmountMXN: null,
            advanceCustomer: null,
            conversionAdvance: null,
            balance: null,
        }
        return body;
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
            },
            {
                relation: 'proofPaymentQuotations',
                scope: {
                    include: [
                        {
                            relation: 'documents',
                            scope: {
                                fields: ['id', 'fileURL', 'name', 'extension', 'proofPaymentQuotationId'],
                            }
                        }
                    ]
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
        const {subtotal, additionalDiscount, percentageIva, iva, total, advance, exchangeRate, balance, percentageAdditionalDiscount, advanceCustomer, conversionAdvance} = this.getPricesQuotation(quotation);

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
                subtotal: subtotal,
                additionalDiscount: additionalDiscount,
                percentageIva: percentageIva,
                iva: iva,
                total: total,
                advance: advance,
                exchangeRate: exchangeRate,
                balance: balance,
                isArchitect: quotation.isArchitect,
                architectName: quotation.architectName,
                commissionPercentageArchitect: quotation.commissionPercentageArchitect,
                isReferencedCustomer: quotation.isReferencedCustomer,
                referenceCustomerId: quotation.referenceCustomerId,
                commissionPercentagereferencedCustomer: quotation.commissionPercentagereferencedCustomer,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                advanceCustomer: advanceCustomer,
                conversionAdvance: conversionAdvance,
                status: quotation.status,
                mainProjectManagerId: quotation?.mainProjectManagerId,
                percentageMainProjectManager: quotation?.percentageMainProjectManager,
            },
            // quotation: {
            //     subtotal: quotation.subtotal,
            //     additionalDiscount: quotation.additionalDiscount,
            //     percentageIva: quotation.percentageIva,
            //     iva: quotation.iva,
            //     total: quotation.total,
            //     advance: quotation.advance,
            //     exchangeRate: quotation.exchangeRate,
            //     balance: quotation.balance,
            //     isArchitect: quotation.isArchitect,
            //     architectName: quotation.architectName,
            //     commissionPercentageArchitect: quotation.commissionPercentageArchitect,
            //     isReferencedCustomer: quotation.isReferencedCustomer,
            //     referenceCustomerId: quotation.referenceCustomerId,
            //     commissionPercentagereferencedCustomer: quotation.commissionPercentagereferencedCustomer,
            //     percentageAdditionalDiscount: quotation?.percentageAdditionalDiscount,
            //     advanceCustomer: quotation?.advanceCustomer,
            //     conversionAdvance: quotation?.conversionAdvance,
            //     status: quotation.status,
            //     mainProjectManagerId: quotation?.mainProjectManagerId,
            //     percentageMainProjectManager: quotation?.percentageMainProjectManager,

            // },
            commisions: {
                architectName: quotation.architectName,
                commissionPercentageArchitect: quotation.commissionPercentageArchitect,
                referencedCustomerName: quotation?.referenceCustomer?.firstName,
                projectManagers: projectManagers,
                designers: designers
            },
            proofPaymentQuotations: quotation?.proofPaymentQuotations
        }
        return response
    }

    async updateById(id: number, data: UpdateQuotation,) {
        const {customer, projectManagers, designers, products, quotation, isDraft, proofPaymentQuotation} = data;
        const {isReferencedCustomer} = quotation;
        await this.validateBodyQuotationUpdate(data);
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        let groupId = null;
        let customerId = null;
        try {
            groupId = await this.createOrGetGroup(customer);
            customerId = await this.createOrGetCustomer({...customer}, groupId);
            const userId = this.user.id;
            const findQuotation = await this.findQuotationById(id);
            await this.updateQuotation(quotation, isDraft, customerId, userId, id);
            await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
            await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
            await this.updateProofPayments(proofPaymentQuotation, id);
            return this.findQuotationById(id);
        } catch (error) {
            // if (customerId)
            //     await this.customerRepository.deleteById(customerId);
            // if (groupId)
            //     await this.groupRepository.deleteById(groupId);
            throw this.responseService.badRequest(error?.message ? error?.message : error);
        }
    }

    async deleteById(id: number) {
        await this.quotationRepository.deleteById(id);
    }

    async changeStatusToReviewAdmin(id: number, body: {isFractionate: boolean, isRejected: boolean, comment: string}) {
        const quotation = await this.findQuotationAndProductsById(id);
        await this.validateChangeStatusSM(body);
        if (quotation.status !== StatusQuotationE.ENREVISIONSM)
            throw this.responseService.badRequest(`La cotizacion aun no se encuentra en revision por SM.`)

        let prices = {}, status = null;
        const {isFractionate, isRejected, comment} = body;

        if (isRejected === true)
            status = StatusQuotationE.RECHAZADA;
        else {
            status = StatusQuotationE.ENREVISIONADMINSITRACION;
            if (isFractionate === true)
                prices = this.calculatePricesExchangeRate(quotation);
        }

        await this.quotationRepository.updateById(id, {status, comment, ...prices});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async changeStatusToClose(id: number, body: {isRejected: boolean, comment: string}) {
        const quotation = await this.findQuotationAndProductsById(id);
        await this.validateChangeStatusClose(body);
        if (quotation.status !== StatusQuotationE.ENREVISIONADMINSITRACION)
            throw this.responseService.badRequest(`La cotizacion aun no se encuentra en revision por administración.`)

        let status = null;
        const {isRejected, comment} = body;

        if (isRejected === true)
            status = StatusQuotationE.RECHAZADA;
        else {
            status = StatusQuotationE.CERRADA;
            await this.projectService.create({quotationId: id});
        }

        await this.quotationRepository.updateById(id, {status, comment, closingDate: isRejected === true ? undefined : new Date()});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }


    async validateChangeStatusSM(body: {isFractionate: boolean, isRejected: boolean, comment: string}) {
        try {
            await schemaChangeStatusSM.validateAsync(body);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateChangeStatusClose(body: {isRejected: boolean, comment: string}) {
        try {
            await schemaChangeStatusClose.validateAsync(body);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    bigNumberMultipliedBy(price: number, value: number): number {
        return Number(new BigNumber(price).multipliedBy(new BigNumber(value)).toFixed(2));
    }

    roundToTwoDecimals(num: number): number {
        return Number(new BigNumber(num).toFixed(2));
    }

    calculatePricesExchangeRate(quotation: Quotation) {
        const {exchangeRateQuotation} = quotation;
        if (exchangeRateQuotation == ExchangeRateQuotationE.EUR) {
            const {subtotalEUR, percentageAdditionalDiscountEUR, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR} = quotation
            const USD = 1.074;
            const MXN = 19.28;

            const bodyMXN = {
                subtotalMXN: this.bigNumberMultipliedBy(subtotalEUR, MXN),
                percentageAdditionalDiscountMXN: this.roundToTwoDecimals(percentageAdditionalDiscountEUR),
                additionalDiscountMXN: this.bigNumberMultipliedBy(additionalDiscountEUR, MXN),
                percentageIva: this.roundToTwoDecimals(percentageIva),
                ivaMXN: this.bigNumberMultipliedBy(ivaEUR, MXN),
                totalMXN: this.bigNumberMultipliedBy(totalEUR, MXN),
                percentageAdvanceMXN: this.roundToTwoDecimals(percentageAdvanceEUR),
                advanceMXN: this.bigNumberMultipliedBy(advanceEUR, MXN),
                exchangeRateMXN: ExchangeRateE.MXN,
                exchangeRateAmountMXN: 15,
                advanceCustomerMXN: this.bigNumberMultipliedBy(advanceCustomerEUR, MXN),
                conversionAdvanceMXN: this.bigNumberMultipliedBy(conversionAdvanceEUR, MXN),
                balanceMXN: this.bigNumberMultipliedBy(balanceEUR, MXN),
            }

            const bodyUSD = {
                subtotalUSD: this.bigNumberMultipliedBy(subtotalEUR, USD),
                percentageAdditionalDiscountUSD: this.roundToTwoDecimals(percentageAdditionalDiscountEUR),
                additionalDiscountUSD: this.bigNumberMultipliedBy(additionalDiscountEUR, USD),
                percentageIva: this.roundToTwoDecimals(percentageIva),
                ivaUSD: this.bigNumberMultipliedBy(ivaEUR, USD),
                totalUSD: this.bigNumberMultipliedBy(totalEUR, USD),
                percentageAdvanceUSD: this.roundToTwoDecimals(percentageAdvanceEUR),
                advanceUSD: this.bigNumberMultipliedBy(advanceEUR, USD),
                exchangeRateUSD: ExchangeRateE.USD,
                exchangeRateAmountUSD: 15,
                advanceCustomerUSD: this.bigNumberMultipliedBy(advanceCustomerEUR, USD),
                conversionAdvanceUSD: this.bigNumberMultipliedBy(conversionAdvanceEUR, USD),
                balanceUSD: this.bigNumberMultipliedBy(balanceEUR, USD),
            }
            return {...bodyMXN, ...bodyUSD}

        }

        if (exchangeRateQuotation == ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscountMXN, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN} = quotation
            const EUR = 0.05184;
            const USD = 0.05566;

            const bodyEUR = {
                subtotalEUR: this.bigNumberMultipliedBy(subtotalMXN, EUR),
                percentageAdditionalDiscountEUR: this.roundToTwoDecimals(percentageAdditionalDiscountMXN),
                additionalDiscountEUR: this.bigNumberMultipliedBy(additionalDiscountMXN, EUR),
                percentageIva: this.roundToTwoDecimals(percentageIva),
                ivaEUR: this.bigNumberMultipliedBy(ivaMXN, EUR),
                totalEUR: this.bigNumberMultipliedBy(totalMXN, EUR),
                percentageAdvanceEUR: this.roundToTwoDecimals(percentageAdvanceMXN),
                advanceEUR: this.bigNumberMultipliedBy(advanceMXN, EUR),
                exchangeRateEUR: ExchangeRateE.EUR,
                exchangeRateAmountEUR: 15,
                advanceCustomerEUR: this.bigNumberMultipliedBy(advanceCustomerMXN, EUR),
                conversionAdvanceEUR: this.bigNumberMultipliedBy(conversionAdvanceMXN, EUR),
                balanceEUR: this.bigNumberMultipliedBy(balanceMXN, EUR),
            }

            const bodyUSD = {
                subtotalUSD: this.bigNumberMultipliedBy(subtotalMXN, USD),
                percentageAdditionalDiscountUSD: this.bigNumberMultipliedBy(percentageAdditionalDiscountMXN, USD),
                additionalDiscountUSD: this.bigNumberMultipliedBy(additionalDiscountMXN, USD),
                percentageIva: this.bigNumberMultipliedBy(percentageIva, USD),
                ivaUSD: this.bigNumberMultipliedBy(ivaMXN, USD),
                totalUSD: this.bigNumberMultipliedBy(totalMXN, USD),
                percentageAdvanceUSD: this.bigNumberMultipliedBy(percentageAdvanceMXN, USD),
                advanceUSD: this.bigNumberMultipliedBy(advanceMXN, USD),
                exchangeRateUSD: ExchangeRateE.USD,
                exchangeRateAmountUSD: 15,
                advanceCustomerUSD: this.bigNumberMultipliedBy(advanceCustomerMXN, USD),
                conversionAdvanceUSD: this.bigNumberMultipliedBy(conversionAdvanceMXN, USD),
                balanceUSD: this.bigNumberMultipliedBy(balanceMXN, USD),
            }
            return {...bodyEUR, ...bodyUSD}

        }

        if (exchangeRateQuotation == ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscountUSD, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD} = quotation
            const EUR = 0.9315;
            const MXN = 17.95;

            const bodyMXN = {
                subtotalMXN: this.bigNumberMultipliedBy(subtotalUSD, MXN),
                percentageAdditionalDiscountMXN: this.bigNumberMultipliedBy(percentageAdditionalDiscountUSD, MXN),
                additionalDiscountMXN: this.bigNumberMultipliedBy(additionalDiscountUSD, MXN),
                percentageIva: this.bigNumberMultipliedBy(percentageIva, MXN),
                ivaMXN: this.bigNumberMultipliedBy(ivaUSD, MXN),
                totalMXN: this.bigNumberMultipliedBy(totalUSD, MXN),
                percentageAdvanceMXN: this.bigNumberMultipliedBy(percentageAdvanceUSD, MXN),
                advanceMXN: this.bigNumberMultipliedBy(advanceUSD, MXN),
                exchangeRateMXN: ExchangeRateE.MXN,
                exchangeRateAmountMXN: 15,
                advanceCustomerMXN: this.bigNumberMultipliedBy(advanceCustomerUSD, MXN),
                conversionAdvanceMXN: this.bigNumberMultipliedBy(conversionAdvanceUSD, MXN),
                balanceMXN: this.bigNumberMultipliedBy(balanceUSD, MXN),
            }

            const bodyEUR = {
                subtotalEUR: this.bigNumberMultipliedBy(subtotalUSD, EUR),
                percentageAdditionalDiscountEUR: this.bigNumberMultipliedBy(percentageAdditionalDiscountUSD, EUR),
                additionalDiscountEUR: this.bigNumberMultipliedBy(additionalDiscountUSD, EUR),
                percentageIva: this.bigNumberMultipliedBy(percentageIva, EUR),
                ivaEUR: this.bigNumberMultipliedBy(ivaUSD, EUR),
                totalEUR: this.bigNumberMultipliedBy(totalUSD, EUR),
                percentageAdvanceEUR: this.bigNumberMultipliedBy(percentageAdvanceUSD, EUR),
                advanceEUR: this.bigNumberMultipliedBy(advanceUSD, EUR),
                exchangeRateEUR: ExchangeRateE.EUR,
                exchangeRateAmountEUR: 15,
                advanceCustomerEUR: this.bigNumberMultipliedBy(advanceCustomerUSD, EUR),
                conversionAdvanceEUR: this.bigNumberMultipliedBy(conversionAdvanceUSD, EUR),
                balanceEUR: this.bigNumberMultipliedBy(balanceUSD, EUR),
            }

            return {...bodyMXN, ...bodyEUR}
        }
        return {}
    }

}
