import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, IsolationLevel, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import {AccessLevelRolE, CurrencyE, ExchangeRateE, ExchangeRateQuotationE, StatusQuotationE, TypeArticleE, TypeCommisionE} from '../enums';
import {CreateQuotation, Customer, Designers, DesignersById, MainProjectManagerCommissionsI, ProjectManagers, ProjectManagersById, QuotationFindOneResponse, QuotationI, UpdateQuotation} from '../interface';
import {schemaChangeStatusClose, schemaChangeStatusSM, schemaCreateQuotition, schemaUpdateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {Document, ProofPaymentQuotationCreate, Quotation, QuotationProductsCreate} from '../models';
import {DocumentSchema} from '../models/base/document.model';
import {ClassificationPercentageMainpmRepository, ClassificationRepository, CustomerRepository, DocumentRepository, GroupRepository, ProductRepository, ProofPaymentQuotationRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository, UserRepository} from '../repositories';
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
        public projectService: ProjectService,
        @repository(ClassificationRepository)
        public classificationRepository: ClassificationRepository,
        @repository(ClassificationPercentageMainpmRepository)
        public classificationPercentageMainpmRepository: ClassificationPercentageMainpmRepository,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository
    ) { }

    async create(data: CreateQuotation) {
        const {id, customer, projectManagers, designers, products, quotation, isDraft, proofPaymentQuotation} = data;
        const {isReferencedCustomer, mainProjectManagerId, mainProjectManagerCommissions} = quotation;
        const branchId = this.user.branchId;
        if (!branchId)
            throw this.responseService.badRequest("El usuario creacion no cuenta con una sucursal asignada.");
        //Falta agregar validacion para saber cuando es borrador o no
        await this.validateBodyQuotation(data);
        await this.validateMainPMAndSecondary(mainProjectManagerId, projectManagers);
        if (isReferencedCustomer === true)
            await this.findUserById(quotation.referenceCustomerId);
        let groupId = null;
        let customerId = null;
        const showroomManagerId = await this.getSM(mainProjectManagerId);
        try {
            groupId = await this.createOrGetGroup(customer);
            customerId = await this.createOrGetCustomer({...customer}, groupId);
            const userId = this.user.id;
            delete quotation.mainProjectManagerCommissions;
            if (id === null || id == undefined) {
                const createQuotation = await this.createQuatation(quotation, isDraft, customerId, userId, branchId, showroomManagerId);
                await this.createProofPayments(proofPaymentQuotation, createQuotation.id);
                await this.createManyQuotition(projectManagers, designers, products, createQuotation.id)
                await this.createComissionPmClasification(createQuotation.id, mainProjectManagerCommissions)
                return createQuotation;
            } else {
                const findQuotation = await this.findQuotationById(id);
                await this.updateQuotation(quotation, isDraft, customerId, userId, id);
                await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
                await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
                await this.updateProofPayments(proofPaymentQuotation, id);
                await this.updatecreateComissionPmClasification(findQuotation.id, mainProjectManagerCommissions)
                return this.findQuotationById(id);
            }
        } catch (error) {
            if (customer?.name && customerId) {
                await this.userRepository.deleteById(customerId);
            }
            throw this.responseService.badRequest(error?.message ? error?.message : error);
        }

    }

    async createComissionPmClasification(quotationId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage} = mainProjectManagerCommissions[index];
            await this.classificationPercentageMainpmRepository.create({quotationId, classificationId, commissionPercentage, type: TypeCommisionE.MAIN_PROJECT_MANAGER});
        }
    }

    async updatecreateComissionPmClasification(quotationId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage, id} = mainProjectManagerCommissions[index];
            // const classificationPercentageMainpm = await this.classificationPercentageMainpmRepository.findOne({where: {classificationId, quotationId, type: TypeCommisionE.MAIN_PROJECT_MANAGER}});
            if (id) {
                await this.classificationPercentageMainpmRepository.updateById(id, {commissionPercentage, });
            } else {
                await this.classificationPercentageMainpmRepository.create({quotationId, classificationId, commissionPercentage, type: TypeCommisionE.MAIN_PROJECT_MANAGER});
            }
        }
    }

    async createComissionPSClasification(quotationProjectManagerId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage} = mainProjectManagerCommissions[index];
            await this.classificationPercentageMainpmRepository.create({quotationProjectManagerId, classificationId, commissionPercentage, type: TypeCommisionE.PROJECT_MANAGER});
        }
    }

    async createComissionDesignerClasification(quotationDesignerId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage} = mainProjectManagerCommissions[index];
            await this.classificationPercentageMainpmRepository.create({quotationDesignerId, classificationId, commissionPercentage, type: TypeCommisionE.DESIGNER});
        }
    }

    async updatecreateComissionPSClasification(quotationProjectManagerId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage, id} = mainProjectManagerCommissions[index];
            // const classificationPercentageMainpm = await this.classificationPercentageMainpmRepository.findOne({where: {classificationId, quotationProjectManagerId, type: TypeCommisionE.PROJECT_MANAGER}});
            if (id) {
                await this.classificationPercentageMainpmRepository.updateById(id, {commissionPercentage, });
            } else {
                await this.classificationPercentageMainpmRepository.create({quotationProjectManagerId, classificationId, commissionPercentage, type: TypeCommisionE.PROJECT_MANAGER});
            }
        }
    }
    async updatecreateComissionDesignerClasification(quotationDesignerId: number, mainProjectManagerCommissions: MainProjectManagerCommissionsI[] = []) {
        for (let index = 0; index < mainProjectManagerCommissions?.length; index++) {
            const {classificationId, commissionPercentage, id} = mainProjectManagerCommissions[index];
            // const classificationPercentageMainpm = await this.classificationPercentageMainpmRepository.findOne({where: {classificationId, quotationProjectManagerId, type: TypeCommisionE.DESIGNER}});
            if (id) {
                await this.classificationPercentageMainpmRepository.updateById(id, {commissionPercentage, });
            } else {
                await this.classificationPercentageMainpmRepository.create({quotationDesignerId, classificationId, commissionPercentage, type: TypeCommisionE.DESIGNER});
            }
        }
    }

    async createProofPayments(proofPaymentQuotation: ProofPaymentQuotationCreate[], quotationId: number) {
        for (let index = 0; index < proofPaymentQuotation?.length; index++) {
            const element = proofPaymentQuotation[index];
            element.quotationId = quotationId;
            await this.proofPaymentQuotationService.create(element)
        }
    }

    async getSM(mainProjectManagerId: number) {
        const user = await this.userRepository.findOne({where: {id: mainProjectManagerId}});
        if (!user)
            throw this.responseService.badRequest("El PM principal no existe.");

        const sm = await this.userRepository.findOne({where: {branchId: user.branchId, isShowroomManager: true}});
        if (!sm || !sm?.id)
            throw this.responseService.badRequest("Aun no se encuentra un Showroom manager en tu equipo.");
        return sm.id;
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

    async createQuatation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, branchId: number, showroomManagerId: number) {
        const data = this.convertExchangeRateQuotation(quotation);
        const bodyQuotation = {
            ...data,
            // exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            branchId,
            userId,
            showroomManagerId
        }
        return this.quotationRepository.create(bodyQuotation);
    }

    convertExchangeRateQuotation(quotation: QuotationI) {
        const {exchangeRateQuotation, subtotal, percentageAdditionalDiscount, additionalDiscount, percentageIva, iva, total, percentageAdvance, advance, exchangeRate, advanceCustomer, conversionAdvance, balance, ...data} = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const body = {
                subtotalEUR: subtotal,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscountEUR: additionalDiscount,
                percentageIva: percentageIva,
                ivaEUR: iva,
                totalEUR: total,
                percentageAdvanceEUR: percentageAdvance,
                advanceEUR: advance,
                exchangeRate: exchangeRate,
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
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscountMXN: additionalDiscount,
                percentageIva: percentageIva,
                ivaMXN: iva,
                totalMXN: total,
                percentageAdvanceMXN: percentageAdvance,
                advanceMXN: advance,
                exchangeRate: exchangeRate,
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
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscountUSD: additionalDiscount,
                percentageIva: percentageIva,
                ivaUSD: iva,
                totalUSD: total,
                percentageAdvanceUSD: percentageAdvance,
                advanceUSD: advance,
                exchangeRate: exchangeRate,
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

    async createManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[], quotationId: number) {
        for (const element of projectManagers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const quotationProjectManager = await this.quotationProjectManagerRepository.create({quotationId: quotationId, userId: element.userId, });
                await this.createComissionPSClasification(quotationProjectManager.id, element.projectManagerCommissions);
            }
        }
        for (const element of designers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const quotationDesigner = await this.quotationDesignerRepository.create({quotationId: quotationId, userId: element.userId});
                await this.createComissionDesignerClasification(quotationDesigner.id, element.commissionPercentageDesigner);
            }
        }
        for (const element of products) {
            const product = await this.productRepository.findOne({where: {id: element.productId}});
            if (product) {
                const {mainMaterialImg, mainFinishImg, secondaryMaterialImg, secondaryFinishingImag, document} = element
                delete element.mainMaterialImg;
                delete element.mainFinishImg;
                delete element.secondaryMaterialImg;
                delete element.secondaryFinishingImag;
                delete element.document;
                const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost});
                await this.createDocumentProduct(response.productId, document)
                await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                await this.createDocumentMainFinish(response.id, mainFinishImg);
                await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
            }
        }
    }

    async createDocumentProduct(productId: number, document?: DocumentSchema) {
        if (document && !document?.id) {
            await this.productRepository.document(productId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async createDocumentMainMaterial(quotationProductId: number, document?: DocumentSchema) {
        if (document && !document?.id) {
            await this.quotationProductsRepository.mainMaterialImage(quotationProductId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async createDocumentMainFinish(quotationProductId: number, document?: Document) {
        if (document && !document?.id) {
            await this.quotationProductsRepository.mainFinishImage(quotationProductId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async createDocumentSecondaryMaterial(quotationProductId: number, document?: Document) {
        if (document && !document?.id) {
            await this.quotationProductsRepository.secondaryMaterialImage(quotationProductId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async createDocumentSecondaryFinishingImage(quotationProductId: number, document?: Document) {
        if (document && !document?.id) {
            await this.quotationProductsRepository.secondaryFinishingImage(quotationProductId).create(document);
        } else if (document) {
            await this.documentRepository.updateById(document.id, {...document});
        }
    }

    async deleteManyQuotation(quotation: Quotation, projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[],) {
        const {id} = quotation;
        const projectManagersMap = projectManagers.map((value) => value.userId);
        const projectManagersDelete = quotation?.projectManagers?.filter((value) => !projectManagersMap.includes(value?.id ?? 0)) ?? []
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

    async updateManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[], quotationId: number) {

        for (const element of projectManagers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const findQuotationPM = await this.quotationProjectManagerRepository.findOne({where: {quotationId: quotationId, userId: element.userId}});
                if (findQuotationPM) {
                    // await this.quotationProjectManagerRepository.updateById(findQuotationPM.id, {});
                    await this.updatecreateComissionPSClasification(findQuotationPM.id, element.projectManagerCommissions)
                }
                else {
                    const qpm = await this.quotationProjectManagerRepository.create({quotationId: quotationId, userId: element.userId});
                    await this.createComissionPSClasification(qpm.id, element.projectManagerCommissions)

                }

            }
        }
        for (const element of designers) {
            const user = await this.userRepository.findOne({where: {id: element.userId}});
            if (user) {
                const findQuotationD = await this.quotationDesignerRepository.findOne({where: {quotationId: quotationId, userId: element.userId}});
                if (findQuotationD) {
                    // await this.quotationDesignerRepository.updateById(findQuotationD.id, {commissionPercentageDesigner: element.commissionPercentageDesigner});
                    await this.updatecreateComissionDesignerClasification(findQuotationD.id, element.commissionPercentageDesigner)
                }
                else {
                    const quotationDesigner = await this.quotationDesignerRepository.create({quotationId: quotationId, userId: element.userId});
                    await this.createComissionDesignerClasification(quotationDesigner.id, element.commissionPercentageDesigner)

                }
            }
        }
        for (const element of products) {

            const product = await this.productRepository.findOne({where: {id: element.productId}});
            if (product) {
                const findQuotationP = await this.quotationProductsRepository.findOne({where: {quotationId: quotationId, productId: element.productId}});
                if (findQuotationP) {
                    const {mainMaterialImg, mainFinishImg, secondaryMaterialImg, secondaryFinishingImag, document} = element
                    delete element.mainMaterialImg;
                    delete element.mainFinishImg;
                    delete element.secondaryMaterialImg;
                    delete element.secondaryFinishingImag;
                    delete element.document;
                    await this.quotationProductsRepository.updateById(findQuotationP.id, element);
                    await this.createDocumentProduct(findQuotationP.productId, document)
                    await this.createDocumentMainMaterial(findQuotationP.id, mainMaterialImg)
                    await this.createDocumentMainFinish(findQuotationP.id, mainFinishImg);
                    await this.createDocumentSecondaryMaterial(findQuotationP.id, secondaryMaterialImg);
                    await this.createDocumentSecondaryFinishingImage(findQuotationP.id, secondaryFinishingImag);
                } else {
                    const {mainMaterialImg, mainFinishImg, secondaryMaterialImg, secondaryFinishingImag, document} = element
                    delete element.mainMaterialImg;
                    delete element.mainFinishImg;
                    delete element.secondaryMaterialImg;
                    delete element.secondaryFinishingImag;
                    delete element.document;
                    const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost});
                    await this.createDocumentProduct(response.productId, document)
                    await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                    await this.createDocumentMainFinish(response.id, mainFinishImg);
                    await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                    await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
                }
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
            where = {...where, mainProjectManagerId: this.user.id}
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
                relation: 'mainProjectManager',
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
            const {id, customer, projectManagers, exchangeRateQuotation, status, updatedAt, branch, mainProjectManager, mainProjectManagerId} = value;
            const {name} = customer;
            const {total} = this.getPricesQuotation(value);
            return {
                id,
                customerName: name,
                pm: mainProjectManager ? `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}` : '',
                pmId: mainProjectManagerId,
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
            const {subtotalEUR, percentageAdditionalDiscount, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, exchangeRate, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR} = quotation
            const body = {
                subtotal: subtotalEUR,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountEUR,
                percentageIva: percentageIva,
                iva: ivaEUR,
                total: totalEUR,
                percentageAdvance: percentageAdvanceEUR,
                advance: advanceEUR,
                exchangeRate: exchangeRate,
                exchangeRateAmountEUR: 15,
                advanceCustomer: advanceCustomerEUR,
                conversionAdvance: conversionAdvanceEUR,
                balance: balanceEUR,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscount, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, exchangeRate, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD} = quotation
            const body = {
                subtotal: subtotalUSD,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountUSD,
                percentageIva: percentageIva,
                iva: ivaUSD,
                total: totalUSD,
                percentageAdvance: percentageAdvanceUSD,
                advance: advanceUSD,
                exchangeRate: exchangeRate,
                exchangeRateAmountUSD: 15,
                advanceCustomer: advanceCustomerUSD,
                conversionAdvance: conversionAdvanceUSD,
                balance: balanceUSD,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscount, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, exchangeRate, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN} = quotation
            const body = {
                subtotal: subtotalMXN,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountMXN,
                percentageIva: percentageIva,
                iva: ivaMXN,
                total: totalMXN,
                percentageAdvance: percentageAdvanceMXN,
                advance: advanceMXN,
                exchangeRate: exchangeRate,
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
                relation: 'quotationProducts',
                scope: {
                    include: [
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
                            relation: 'product',
                            scope: {
                                include: [
                                    'brand', 'document', 'line'
                                ]
                            }
                        }
                    ]
                }

            },
            {
                relation: 'projectManagers',
                scope: {
                    fields: ['id', 'firstName'],
                    include: [{
                        relation: 'quotationPM',
                        scope: {
                            include: ['classificationPercentageMainpms']
                        }
                    },]
                }
            },
            {
                relation: 'designers',
                scope: {
                    fields: ['id', 'firstName'],
                    include: [{
                        relation: 'quotationDe',
                        scope: {
                            include: ['classificationPercentageMainpms']
                        }
                    }]
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
            },
            {
                relation: 'classificationPercentageMainpms',
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
        const quotation = await this.quotationRepository.findById(id, filter);
        const products: any[] = [];
        const projectManagers: ProjectManagersById[] = [];
        const designers: DesignersById[] = [];
        for (const iterator of quotation?.quotationProducts ?? []) {
            const {line, name, document, brand} = iterator.product;
            products.push({
                ...iterator,
                SKU: iterator?.SKU,
                brandName: iterator?.brand?.brandName ?? '',
                status: iterator.status,
                description: `${line?.name} ${name} ${iterator.mainMaterial} ${iterator.mainFinish} ${iterator.secondaryMaterial} ${iterator.secondaryFinishing} ${iterator.measureWide}`,
                image: document ? document?.fileURL : '',
                quantity: iterator.quantity,
                percentageDiscountProduct: iterator.percentageDiscountProduct,
                discountProduct: iterator.discountProduct,
                percentageMaximumDiscount: iterator.percentageMaximumDiscount,
                maximumDiscount: iterator.maximumDiscount,
                subtotal: iterator.subtotal,
                mainMaterialImage: iterator?.mainMaterialImage ?? null,
                mainFinishImage: iterator?.mainFinishImage ?? null,
                secondaryMaterialImage: iterator?.secondaryMaterialImage ?? null,
                secondaryFinishingImage: iterator?.secondaryFinishingImage ?? null,
                line: line,
                brand: brand,
                document: document,
            })
        }

        for (const iterator of quotation?.projectManagers ?? []) {
            projectManagers.push({
                id: iterator.id,
                projectManagerName: iterator.firstName,
                classificationPercentageMainpms: iterator.quotationPM?.classificationPercentageMainpms,
            })
        }

        for (const iterator of quotation?.designers ?? []) {
            designers.push({
                id: iterator.id,
                designerName: iterator.firstName,
                commissionPercentageDesigner: iterator.quotationDe.classificationPercentageMainpms,
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
                mainProjectManagerCommissions: quotation?.classificationPercentageMainpms,
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
                rejectedComment: quotation?.comment,
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
        await this.validateIfExistCustomer(quotation);
        await this.validateChangeStatusSM(body);
        if (quotation.status !== StatusQuotationE.ENREVISIONSM)
            throw this.responseService.badRequest(`La cotizacion aun no se encuentra en revision por SM.`)

        let prices = {}, status = null;
        const {isFractionate, isRejected, comment} = body;
        let typeFractional: any;
        if (isRejected === true)
            status = StatusQuotationE.RECHAZADA;
        else {
            status = StatusQuotationE.ENREVISIONADMINSITRACION;
            if (isFractionate === true) {
                typeFractional = await this.typeCurrencyFractionate(id);
                prices = this.calculatePricesExchangeRate(quotation, typeFractional);
            }
        }
        await this.quotationRepository.updateById(id, {status, comment, ...prices, isFractionate, typeFractional});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async typeCurrencyFractionate(quotationId: number) {
        const quotationProducts = await this.quotationProductsRepository.find({where: {quotationId}});
        const EURO = quotationProducts.find(value => value.currency == CurrencyE.EURO);
        const PESO_MEXICANO = quotationProducts.find(value => value.currency == CurrencyE.PESO_MEXICANO);
        const USD = quotationProducts.find(value => value.currency == CurrencyE.USD);
        return {EUR: EURO ? true : false, MXN: PESO_MEXICANO ? true : false, USD: USD ? true : false}
    }
    async validateIfExistCustomer(quotation: Quotation) {
        if (!quotation?.customerId)
            throw this.responseService.badRequest("La cotizacion debe tener un cliente asignado.");
    }

    async changeStatusToClose(id: number, body: {isRejected: boolean, comment: string}) {
        const transaction = await this.quotationRepository.dataSource.beginTransaction(IsolationLevel.SERIALIZABLE);
        try {
            const quotation = await this.findQuotationAndProductsById(id);
            await this.validateChangeStatusClose(body);
            if (quotation.status !== StatusQuotationE.ENREVISIONADMINSITRACION)
                throw this.responseService.badRequest(`La cotizacion aun no se encuentra en revision por administración.`)

            let status = null;
            const {isRejected, comment} = body;

            if (isRejected === true)
                status = StatusQuotationE.RECHAZADA;
            else {
                await this.validateAdvanceCustomerAndEnsamblado(id);
                status = StatusQuotationE.CERRADA;
                await this.projectService.create({quotationId: id}, transaction);
            }

            await this.quotationRepository.updateById(id, {status, comment, closingDate: isRejected === true ? undefined : new Date()}, {transaction});
            await transaction.commit()
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            await transaction.rollback();
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async validateAdvanceCustomerAndEnsamblado(quotationId: number) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'proofPaymentQuotations'}, {relation: 'quotationProducts'}]});
        const {conversionAdvance} = this.getPricesQuotation(quotation);
        if (conversionAdvance && conversionAdvance > 0 && (!quotation?.proofPaymentQuotations || quotation?.proofPaymentQuotations.length <= 0)) {
            throw this.responseService.badRequest("No puedes finalizar la cotización sin capturar la información del anticipo correspondiente. Por favor, revisa y completa esta información.");
        }
        for (let index = 0; index < quotation?.quotationProducts.length; index++) {
            const {productId, assembledProducts} = quotation?.quotationProducts[index];
            const product = await this.productRepository.findOne({where: {id: productId}})
            if (product)
                if (product.typeArticle === TypeArticleE.PRODUCTO_ENSAMBLADO && (!assembledProducts || assembledProducts?.length <= 0))
                    throw this.responseService.badRequest("Algunos productos de tipo ensamble no tienen piezas o ensambles asignados. Por favor, revisa y completa esta información para poder finalizar tu cotización.");
        }

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

    calculatePricesExchangeRate(quotation: Quotation, typeFractional: {EUR: boolean, MXN: boolean, USD: boolean}) {
        //CAMBIAR TIPO DE MONEDA URGENTE
        const {exchangeRateQuotation} = quotation;
        if (exchangeRateQuotation == ExchangeRateQuotationE.EUR) {
            let bodyMXN = {};
            let bodyUSD = {};
            const USD = 1.074;
            const MXN = 19.28;
            const {subtotalEUR, percentageAdditionalDiscount, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR} = quotation
            if (typeFractional.MXN === true) {
                bodyMXN = {
                    subtotalMXN: this.bigNumberMultipliedBy(subtotalEUR, MXN),
                    percentageAdditionalDiscount: this.roundToTwoDecimals(percentageAdditionalDiscount),
                    additionalDiscountMXN: this.bigNumberMultipliedBy(additionalDiscountEUR, MXN),
                    percentageIva: this.roundToTwoDecimals(percentageIva),
                    ivaMXN: this.bigNumberMultipliedBy(ivaEUR, MXN),
                    totalMXN: this.bigNumberMultipliedBy(totalEUR, MXN),
                    percentageAdvanceMXN: this.roundToTwoDecimals(percentageAdvanceEUR),
                    advanceMXN: this.bigNumberMultipliedBy(advanceEUR, MXN),
                    exchangeRateMXN: ExchangeRateE.MXN,
                    exchangeRateAmountMXN: MXN,
                    advanceCustomerMXN: this.bigNumberMultipliedBy(advanceCustomerEUR, MXN),
                    conversionAdvanceMXN: this.bigNumberMultipliedBy(conversionAdvanceEUR, MXN),
                    balanceMXN: this.bigNumberMultipliedBy(balanceEUR, MXN),
                }
            }
            if (typeFractional.USD === true) {
                bodyUSD = {
                    subtotalUSD: this.bigNumberMultipliedBy(subtotalEUR, USD),
                    percentageAdditionalDiscount: this.roundToTwoDecimals(percentageAdditionalDiscount),
                    additionalDiscountUSD: this.bigNumberMultipliedBy(additionalDiscountEUR, USD),
                    percentageIva: this.roundToTwoDecimals(percentageIva),
                    ivaUSD: this.bigNumberMultipliedBy(ivaEUR, USD),
                    totalUSD: this.bigNumberMultipliedBy(totalEUR, USD),
                    percentageAdvanceUSD: this.roundToTwoDecimals(percentageAdvanceEUR),
                    advanceUSD: this.bigNumberMultipliedBy(advanceEUR, USD),
                    exchangeRateUSD: ExchangeRateE.USD,
                    exchangeRateAmountUSD: USD,
                    advanceCustomerUSD: this.bigNumberMultipliedBy(advanceCustomerEUR, USD),
                    conversionAdvanceUSD: this.bigNumberMultipliedBy(conversionAdvanceEUR, USD),
                    balanceUSD: this.bigNumberMultipliedBy(balanceEUR, USD),
                }
            }


            return {...bodyMXN, ...bodyUSD}

        }

        if (exchangeRateQuotation == ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscount, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN} = quotation
            const EUR = 0.05184;
            const USD = 0.05566;
            let bodyEUR = {};
            let bodyUSD = {};
            if (typeFractional.EUR === true) {
                bodyEUR = {
                    subtotalEUR: this.bigNumberMultipliedBy(subtotalMXN, EUR),
                    percentageAdditionalDiscount: this.roundToTwoDecimals(percentageAdditionalDiscount),
                    additionalDiscountEUR: this.bigNumberMultipliedBy(additionalDiscountMXN, EUR),
                    percentageIva: this.roundToTwoDecimals(percentageIva),
                    ivaEUR: this.bigNumberMultipliedBy(ivaMXN, EUR),
                    totalEUR: this.bigNumberMultipliedBy(totalMXN, EUR),
                    percentageAdvanceEUR: this.roundToTwoDecimals(percentageAdvanceMXN),
                    advanceEUR: this.bigNumberMultipliedBy(advanceMXN, EUR),
                    exchangeRateAmountEUR: EUR,
                    advanceCustomerEUR: this.bigNumberMultipliedBy(advanceCustomerMXN, EUR),
                    conversionAdvanceEUR: this.bigNumberMultipliedBy(conversionAdvanceMXN, EUR),
                    balanceEUR: this.bigNumberMultipliedBy(balanceMXN, EUR),
                }
            }
            if (typeFractional.USD === true) {
                bodyUSD = {
                    subtotalUSD: this.bigNumberMultipliedBy(subtotalMXN, USD),
                    percentageAdditionalDiscount: this.bigNumberMultipliedBy(percentageAdditionalDiscount, USD),
                    additionalDiscountUSD: this.bigNumberMultipliedBy(additionalDiscountMXN, USD),
                    percentageIva: this.bigNumberMultipliedBy(percentageIva, USD),
                    ivaUSD: this.bigNumberMultipliedBy(ivaMXN, USD),
                    totalUSD: this.bigNumberMultipliedBy(totalMXN, USD),
                    percentageAdvanceUSD: this.bigNumberMultipliedBy(percentageAdvanceMXN, USD),
                    advanceUSD: this.bigNumberMultipliedBy(advanceMXN, USD),
                    exchangeRateAmountUSD: USD,
                    advanceCustomerUSD: this.bigNumberMultipliedBy(advanceCustomerMXN, USD),
                    conversionAdvanceUSD: this.bigNumberMultipliedBy(conversionAdvanceMXN, USD),
                    balanceUSD: this.bigNumberMultipliedBy(balanceMXN, USD),
                }
            }



            return {...bodyEUR, ...bodyUSD}

        }

        if (exchangeRateQuotation == ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscount, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD} = quotation
            const EUR = 0.9315;
            const MXN = 17.95;

            let bodyMXN = {};
            let bodyEUR = {};
            if (typeFractional.MXN === true) {
                bodyMXN = {
                    subtotalMXN: this.bigNumberMultipliedBy(subtotalUSD, MXN),
                    percentageAdditionalDiscount: this.bigNumberMultipliedBy(percentageAdditionalDiscount, MXN),
                    additionalDiscountMXN: this.bigNumberMultipliedBy(additionalDiscountUSD, MXN),
                    percentageIva: this.bigNumberMultipliedBy(percentageIva, MXN),
                    ivaMXN: this.bigNumberMultipliedBy(ivaUSD, MXN),
                    totalMXN: this.bigNumberMultipliedBy(totalUSD, MXN),
                    percentageAdvanceMXN: this.bigNumberMultipliedBy(percentageAdvanceUSD, MXN),
                    advanceMXN: this.bigNumberMultipliedBy(advanceUSD, MXN),
                    exchangeRateAmountMXN: MXN,
                    advanceCustomerMXN: this.bigNumberMultipliedBy(advanceCustomerUSD, MXN),
                    conversionAdvanceMXN: this.bigNumberMultipliedBy(conversionAdvanceUSD, MXN),
                    balanceMXN: this.bigNumberMultipliedBy(balanceUSD, MXN),
                }

            }


            if (typeFractional.EUR === true) {
                bodyEUR = {
                    subtotalEUR: this.bigNumberMultipliedBy(subtotalUSD, EUR),
                    percentageAdditionalDiscount: this.bigNumberMultipliedBy(percentageAdditionalDiscount, EUR),
                    additionalDiscountEUR: this.bigNumberMultipliedBy(additionalDiscountUSD, EUR),
                    percentageIva: this.bigNumberMultipliedBy(percentageIva, EUR),
                    ivaEUR: this.bigNumberMultipliedBy(ivaUSD, EUR),
                    totalEUR: this.bigNumberMultipliedBy(totalUSD, EUR),
                    percentageAdvanceEUR: this.bigNumberMultipliedBy(percentageAdvanceUSD, EUR),
                    advanceEUR: this.bigNumberMultipliedBy(advanceUSD, EUR),
                    exchangeRateAmountEUR: EUR,
                    advanceCustomerEUR: this.bigNumberMultipliedBy(advanceCustomerUSD, EUR),
                    conversionAdvanceEUR: this.bigNumberMultipliedBy(conversionAdvanceUSD, EUR),
                    balanceEUR: this.bigNumberMultipliedBy(balanceUSD, EUR),
                }
            }

            return {...bodyMXN, ...bodyEUR}
        }
        return {}
    }

}
