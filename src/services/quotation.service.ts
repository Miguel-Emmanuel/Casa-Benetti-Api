import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, IsolationLevel, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import fs from "fs/promises";
import {AccessLevelRolE, AdvancePaymentTypeE, CurrencyE, ExchangeRateE, ExchangeRateQuotationE, ProformaCurrencyE, ProjectStatusE, PurchaseOrdersStatus, ShowRoomDestinationE, StatusQuotationE, TypeArticleE, TypeCommisionE, TypeQuotationE} from '../enums';
import {convertToMoney, convertToMoneyEuro} from '../helpers/convertMoney';
import {CreateQuotation, Customer, Designers, DesignersById, MainProjectManagerCommissionsI, ProductsStock, ProjectManagers, ProjectManagersById, QuotationFindOneResponse, QuotationI, UpdateQuotation, UpdateQuotationI, UpdateQuotationProject} from '../interface';
import {schemaCreateQuotitionShowRoomMaster, schemaUpdateQuotitionProject} from '../joi.validation.ts/quotation-project.validation';
import {schemaChangeStatusClose, schemaChangeStatusSM, schemaCreateQuotition, schemaCreateQuotitionShowRoom, schemaUpdateQuotition} from '../joi.validation.ts/quotation.validation';
import {ResponseServiceBindings} from '../keys';
import {DayExchangeRate, Document, Project, ProofPaymentQuotationCreate, Quotation, QuotationProductsCreate} from '../models';
import {DocumentSchema} from '../models/base/document.model';
import {AccountsReceivableRepository, AdvancePaymentRecordRepository, BranchRepository, ClassificationPercentageMainpmRepository, ClassificationRepository, CommissionPaymentRecordRepository, CustomerRepository, DayExchangeRateRepository, DocumentRepository, GroupRepository, ProductRepository, ProformaRepository, ProjectRepository, ProofPaymentQuotationRepository, PurchaseOrdersRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProductsStockRepository, QuotationProjectManagerRepository, QuotationRepository, UserRepository} from '../repositories';
import {DayExchancheCalculateToService} from './day-exchanche-calculate-to.service';
import {LetterNumberService} from './letter-number.service';
import {PdfService} from './pdf.service';
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
        public documentRepository: DocumentRepository,
        @repository(BranchRepository)
        public branchRepository: BranchRepository,
        @service()
        public pdfService: PdfService,
        @inject(RestBindings.Http.RESPONSE)
        private response: Response,
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,
        @service()
        public dayExchancheCalculateToService: DayExchancheCalculateToService,
        @repository(QuotationProductsStockRepository)
        public quotationProductsStockRepository: QuotationProductsStockRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
        @repository(AdvancePaymentRecordRepository)
        public advancePaymentRecordRepository: AdvancePaymentRecordRepository,
        @service()
        public letterNumberService: LetterNumberService,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository
    ) { }

    async create(data: CreateQuotation) {
        const {id, customer, projectManagers, designers, products, quotation, isDraft, proofPaymentQuotation, typeQuotation, productsStock} = data;

        if (typeQuotation === TypeQuotationE.GENERAL) {
            let showroomManagerId = undefined
            const {isReferencedCustomer, mainProjectManagerId, mainProjectManagerCommissions} = quotation;
            const branchId = this.user.branchId;

            if (!branchId)
                throw this.responseService.badRequest("El usuario creacion no cuenta con una sucursal asignada.");
            //Falta agregar validacion para saber cuando es borrador o no
            await this.validateBodyQuotation(data);
            if (mainProjectManagerId) {
                await this.validateMainPMAndSecondary(mainProjectManagerId, projectManagers);
            }


            if (isReferencedCustomer === true)
                await this.findUserById(quotation.referenceCustomerId);
            let groupId = null;
            let customerId = null;

            if (mainProjectManagerId) {
                showroomManagerId = await this.getSM(mainProjectManagerId);
            }
            try {

                groupId = await this.createOrGetGroup(customer);
                customerId = await this.createOrGetCustomer({...customer}, groupId);
                const userId = this.user.id;
                delete quotation.mainProjectManagerCommissions;


                if (id === null || id == undefined) {
                    const createQuotation = await this.createQuatation(quotation, isDraft, customerId, userId, branchId, showroomManagerId);
                    await this.createProofPayments(proofPaymentQuotation, createQuotation.id);
                    await this.createManyQuotition(projectManagers, designers, products, createQuotation.id, productsStock)
                    await this.createComissionPmClasification(createQuotation.id, mainProjectManagerCommissions);
                    await this.discountStock(productsStock);
                    return createQuotation;
                } else {
                    const findQuotation = await this.findQuotationById(id);
                    await this.updateQuotation(quotation, isDraft, customerId, userId, id);
                    await this.deleteManyQuotation(findQuotation, projectManagers, designers, products, productsStock);
                    await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id, productsStock);
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
        } else {
            return this.quotationShowRoom(data);
        }

    }

    async discountStock(productsStock: ProductsStock[]) {
        for (let index = 0; index < productsStock?.length; index++) {
            const element = productsStock[index];
            const findQuotationProduct = await this.quotationProductsRepository.findOne({where: {id: element.id}});
            if (findQuotationProduct) {
                let stockActual = findQuotationProduct.stock - element.quantity
                if (stockActual < 0)
                    stockActual = 0;
                await this.quotationProductsRepository.updateById(findQuotationProduct.id, {stock: stockActual})
            }
        }
    }

    async downloadPdfClientQuote(id: number) {
        try {
            const findQuotation = await this.findQuotationById(id);
            return await this.createPdfToCustomer(findQuotation.id);
        } catch (error) {
            return this.responseService.badRequest(error?.message ?? error);
        }
    }

    async uploadPdfClientQuote(id: number, data: {document: Document}) {
        await this.findQuotationById(id);
        await this.createDocument(id, data.document);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async createDocument(quotationId: number, document: Document) {
        if (quotationId) {
            if (document && !document?.id) {
                await this.quotationRepository.clientQuote(quotationId).create(document);
            } else if (document) {
                await this.documentRepository.updateById(document.id, {...document});
            }
        }
    }

    async createPdfToCustomer(quotationId: number) {
        const quotation = await this.quotationRepository.findById(quotationId, {
            include: [
                {
                    relation: 'quotationProductsStocks',
                    scope: {
                        include: [
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
                        ]
                    }
                },
                {relation: 'customer'}, {relation: "project"}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}]}}]
        });
        const {customer, mainProjectManager, referenceCustomer, products, project, quotationProductsStocks} = quotation;
        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`


        let productsTemplate = [];
        for (const product of products ?? []) {
            const {brand, document, quotationProducts, line, name} = product;
            const descriptionParts = [
                line?.name,
                name,
                quotationProducts?.mainMaterial,
                quotationProducts?.mainFinish,
                quotationProducts?.secondaryMaterial,
                quotationProducts?.secondaryFinishing
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            const measuresParts = [
                quotationProducts?.measureWide ? `Ancho: ${quotationProducts?.measureWide}` : "",
                quotationProducts?.measureHigh ? `Alto: ${quotationProducts?.measureHigh}` : "",
                quotationProducts?.measureDepth ? `Prof: ${quotationProducts?.measureDepth}` : "",
                quotationProducts?.measureCircumference ? `Circ: ${quotationProducts?.measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            productsTemplate.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProducts?.mainFinish,
                mainFinishImage: quotationProducts?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: quotationProducts?.quantity,
                percentage: quotationProducts?.percentageDiscountProduct,
                subtotal: quotationProducts?.subtotal,
                currencyEuro: quotationProducts?.currency === CurrencyE.EURO,
                currencyUSD: quotationProducts?.currency === CurrencyE.USD,
                currencyPesoMexicano: quotationProducts?.currency === CurrencyE.PESO_MEXICANO,
            })
        }

        for (const iterator of quotationProductsStocks ?? []) {
            const {quotationProducts} = iterator;
            const {product} = quotationProducts;
            const {line, document, brand} = product;
            const descriptionParts = [
                line?.name,
                product?.name,
                quotationProducts?.mainMaterial,
                quotationProducts?.mainFinish,
                quotationProducts?.secondaryMaterial,
                quotationProducts?.secondaryFinishing
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            const measuresParts = [
                quotationProducts?.measureWide ? `Ancho: ${quotationProducts?.measureWide}` : "",
                quotationProducts?.measureHigh ? `Alto: ${quotationProducts?.measureHigh}` : "",
                quotationProducts?.measureDepth ? `Prof: ${quotationProducts?.measureDepth}` : "",
                quotationProducts?.measureCircumference ? `Circ: ${quotationProducts?.measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            productsTemplate.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProducts?.mainFinish,
                mainFinishImage: quotationProducts?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: iterator?.quantity,
                percentage: iterator?.percentageDiscountProduct,
                subtotal: iterator?.subtotal,
                currencyEuro: quotationProducts?.currency === CurrencyE.EURO,
                currencyUSD: quotationProducts?.currency === CurrencyE.USD,
                currencyPesoMexicano: quotationProducts?.currency === CurrencyE.PESO_MEXICANO,
            })
        }
        const {subtotal, additionalDiscount, percentageIva, iva, total, advance, exchangeRate, balance, percentageAdditionalDiscount, advanceCustomer, conversionAdvance, percentageAdvance} = this.getPricesQuotation(quotation);
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`
        try {
            const reference = `${project?.reference ?? ""}`
            const referenceCustomerName = reference.trim() === "" ? "-" : reference
            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": referenceCustomerName,
                "products": productsTemplate,
                subtotal,
                percentageAdditionalDiscount: percentageAdditionalDiscount ?? 0,
                additionalDiscount,
                percentageIva,
                iva,
                total,
                advance,
                advanceCustomer: exchangeRate == 'EUR' ? convertToMoneyEuro(advanceCustomer ?? 0) : convertToMoney(advanceCustomer ?? 0),
                conversionAdvance: convertToMoneyEuro(conversionAdvance ?? 0),
                balance: convertToMoneyEuro(balance ?? 0),
                exchangeRate: "Paridad",
                percentageAdvance,
                emailPM: mainProjectManager?.email,
                isTypeQuotationGeneral: quotation.typeQuotation === TypeQuotationE.GENERAL
            }
            let nameFile = `cotizacion_cliente_${customer ? customer?.name : ''}-${customer ? customer?.lastName : ''}_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            if (quotation.typeQuotation === TypeQuotationE.SHOWROOM)
                nameFile = `showroom_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            // await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/cotizacion_cliente.html`, properties, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
            const buffer = await this.pdfService.createPDFWithTemplateHtmlToBuffer(`${process.cwd()}/src/templates/cotizacion_cliente.html`, properties, {format: 'A3'});
            this.response.setHeader('Content-Disposition', `attachment; filename=${nameFile}`);
            this.response.setHeader('Content-Type', 'application/pdf');
            return this.response.status(200).send(buffer)
        } catch (error) {
            console.log('error: ', error)
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

    async createQuatation(quotation: QuotationI, isDraft: boolean, customerId: number | undefined, userId: number, branchId: number, showroomManagerId?: number) {
        const data = this.convertExchangeRateQuotation(quotation);
        const dayExchangeRate = await this.dayExchancheCalculateToService.getdayExchangeRatAll();
        const bodyQuotation = {
            ...data,
            // exchangeRateAmount: 15,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            customerId,
            isDraft,
            branchId,
            userId,
            showroomManagerId,
            ...dayExchangeRate
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

    async createManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[], quotationId: number, productsStock: ProductsStock[]) {
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
                const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost},);
                await this.createDocumentProduct(response.productId, document)
                await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                await this.createDocumentMainFinish(response.id, mainFinishImg);
                await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
            }
        }
        for (let index = 0; index < productsStock?.length; index++) {
            const element = productsStock[index];
            await this.quotationProductsStockRepository.create({
                quotationId, quotationProductsId: element.id, dateReservationDays: element?.reservationDays ? dayjs().add(element?.reservationDays, 'days').toDate() : undefined, isNotificationSent: element?.reservationDays ? false : undefined,
                typeSale: element.typeSale,
                loanInitialDate: element.loanEndDate,
                loanEndDate: element.loanEndDate,
                quantity: element.quantity,
                discountProduct: element.discountProduct,
                originCost: element.originCost,
                factor: element.factor,
                subtotal: element.subtotal,
                percentageDiscountProduct: element.percentageDiscountProduct,
                subtotalDiscount: element.subtotalDiscount,
                price: element.factor * element.originCost
            })
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

    async deleteManyQuotation(quotation: Quotation, projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[], productsStock: ProductsStock[]) {
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

        const productsStockMap = productsStock.map((value) => value.id);
        const productsStockDelete = quotation.quotationProductsStocks?.filter((value) => !productsStockMap.includes(value?.id ?? 0)) ?? []
        for (const element of productsStockDelete) {
            await this.quotationProductsStockRepository.deleteById(element.id);
        }

    }


    async deleteManyQuotationMaster(quotation: Quotation, products: QuotationProductsCreate[], productsStock: ProductsStock[]) {
        const {id} = quotation;

        const productsMap = products.map((value) => value.productId);
        const productsDelete = quotation.products?.filter((value) => !productsMap.includes(value?.id ?? 0)) ?? []
        for (const element of productsDelete) {
            await this.quotationRepository.products(id).unlink(element.id)
        }

        const productsStockMap = productsStock.map((value) => value.id);
        const productsStockDelete = quotation.quotationProductsStocks?.filter((value) => !productsStockMap.includes(value?.id ?? 0)) ?? []
        for (const element of productsStockDelete) {
            await this.quotationProductsStockRepository.deleteById(element.id);
        }

    }

    async updateManyQuotition(projectManagers: ProjectManagers[], designers: Designers[], products: QuotationProductsCreate[], quotationId: number, productsStock: ProductsStock[]) {

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
                    await this.quotationProductsRepository.updateById(findQuotationP.id, {...element});
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
                    // const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost});
                    const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, },);
                    await this.createDocumentProduct(response.productId, document)
                    await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                    await this.createDocumentMainFinish(response.id, mainFinishImg);
                    await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                    await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
                }
            }
        }
        for (let index = 0; index < productsStock?.length; index++) {
            const element = productsStock[index];
            const quotationProductsStock = await this.quotationProductsStockRepository.findOne({where: {quotationId, quotationProductsId: element.id}})
            if (!quotationProductsStock)
                await this.quotationProductsStockRepository.create({
                    quotationId, quotationProductsId: element.id,
                    typeSale: element.typeSale,
                    loanInitialDate: element.loanEndDate,
                    loanEndDate: element.loanEndDate,
                    quantity: element.quantity,
                    discountProduct: element.discountProduct,
                    originCost: element.originCost,
                    factor: element.factor,
                    subtotal: element.subtotal,
                    percentageDiscountProduct: element.percentageDiscountProduct,
                    subtotalDiscount: element.subtotalDiscount,
                    price: element.factor * element.originCost
                })
            else {
                let dateReservationDays;
                if (quotationProductsStock?.dateReservationDays && element?.reservationDays) {
                    dateReservationDays = dayjs(quotationProductsStock?.dateReservationDays).add(element?.reservationDays, 'days').toDate();
                } else if (!quotationProductsStock?.dateReservationDays && element?.reservationDays) {
                    dateReservationDays = dayjs().add(element?.reservationDays, 'days').toDate();
                }
                const isNotificationSent = element?.reservationDays ? false : undefined
                await this.quotationProductsStockRepository.updateById(element.id, {
                    dateReservationDays, isNotificationSent,
                    typeSale: element.typeSale,
                    loanInitialDate: element.loanEndDate,
                    loanEndDate: element.loanEndDate,
                    quantity: element.quantity,
                    discountProduct: element.discountProduct,
                    originCost: element.originCost,
                    factor: element.factor,
                    subtotal: element.subtotal,
                    percentageDiscountProduct: element.percentageDiscountProduct,
                    subtotalDiscount: element.subtotalDiscount,
                    price: element.factor * element.originCost
                })
            }
        }
    }

    async updateManyQuotitionMaster(products: QuotationProductsCreate[], quotationId: number, productsStock: ProductsStock[]) {

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
                    await this.quotationProductsRepository.updateById(findQuotationP.id, {...element});
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
                    // const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost});
                    const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, },);
                    await this.createDocumentProduct(response.productId, document)
                    await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                    await this.createDocumentMainFinish(response.id, mainFinishImg);
                    await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                    await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
                }
            }
        }
        for (let index = 0; index < productsStock?.length; index++) {
            const element = productsStock[index];
            const quotationProductsStock = await this.quotationProductsStockRepository.findOne({where: {quotationId, quotationProductsId: element.id}})
            if (!quotationProductsStock)
                await this.quotationProductsStockRepository.create({
                    quotationId, quotationProductsId: element.id,
                    typeSale: element.typeSale,
                    loanInitialDate: element.loanEndDate,
                    loanEndDate: element.loanEndDate,
                    quantity: element.quantity,
                    discountProduct: element.discountProduct,
                    originCost: element.originCost,
                    factor: element.factor,
                    subtotal: element.subtotal,
                    percentageDiscountProduct: element.percentageDiscountProduct,
                    subtotalDiscount: element.subtotalDiscount,
                    price: element.factor * element.originCost
                })
            else {
                let dateReservationDays;
                if (quotationProductsStock?.dateReservationDays && element?.reservationDays) {
                    dateReservationDays = dayjs(quotationProductsStock?.dateReservationDays).add(element?.reservationDays, 'days').toDate();
                } else if (!quotationProductsStock?.dateReservationDays && element?.reservationDays) {
                    dateReservationDays = dayjs().add(element?.reservationDays, 'days').toDate();
                }
                const isNotificationSent = element?.reservationDays ? false : undefined
                await this.quotationProductsStockRepository.updateById(element.id, {
                    dateReservationDays, isNotificationSent,
                    typeSale: element.typeSale,
                    loanInitialDate: element.loanEndDate,
                    loanEndDate: element.loanEndDate,
                    quantity: element.quantity,
                    discountProduct: element.discountProduct,
                    originCost: element.originCost,
                    factor: element.factor,
                    subtotal: element.subtotal,
                    percentageDiscountProduct: element.percentageDiscountProduct,
                    subtotalDiscount: element.subtotalDiscount,
                    price: element.factor * element.originCost
                })
            }
        }
    }

    async findQuotationById(id: number) {
        const quotation = await this.quotationRepository.findOne({where: {id}, include: [{relation: 'projectManagers'}, {relation: 'designers'}, {relation: 'products'}, {relation: 'quotationProductsStocks'}]})
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation;
    }

    async findQuotationByIdMaster(id: number) {
        const quotation = await this.quotationRepository.findOne({
            where: {id}, include: [
                {relation: 'projectManagers'}, {relation: 'designers'}, {relation: 'products'}, {relation: 'quotationProductsStocks'},
                {
                    relation: 'proofPaymentQuotations',
                    scope: {
                        order: ['createdAt ASC'],
                        include: ['documents']
                    }
                }, {
                    relation: 'classificationPercentageMainpms'
                },
                {
                    relation: 'showroomManager'
                }]

        })
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

    async quotationShowRoom(data: CreateQuotation) {
        const branchId = this.user.branchId;
        if (!branchId)
            throw this.responseService.badRequest("El usuario creacion no cuenta con una sucursal asignada.");
        const {id, quotation, isDraft, branchesId, products, showRoomDestination} = data;
        await this.validateBodyQuotationShowroom(data);
        await this.validateBrancId(branchesId)
        const showroomManagerId = await this.getSMShowRoom(this.user.branchId);
        try {
            if (id === null || id == undefined) {

                const createQuotation = await this.createQuatationShowRoom(quotation, isDraft, this.user.id, branchesId, showroomManagerId, showRoomDestination, branchId);
                await this.createProducts(products, createQuotation.id, branchesId);
                return createQuotation;
            } else {
                const findQuotation = await this.findQuotationById(id);
                await this.deleteProdcuts(findQuotation, products);
                await this.updateProducts(products, findQuotation.id, branchesId)
                await this.updateQuotationShowroom(quotation, isDraft, this.user.id, findQuotation.id, showRoomDestination, branchesId);
                return this.findQuotationById(id);
            }
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async createCommissionPaymentRecord(quotation: Quotation, projectId: number, quotationId: number) {
        const {isArchitect, exchangeRateQuotation, isReferencedCustomer, isProjectManager, isDesigner, showroomManagerId} = quotation;
        //ProjectManager principal
        if (isArchitect === true) {
            const {mainProjectManagerId, classificationPercentageMainpms} = quotation;

            for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                const element = classificationPercentageMainpms[index];
                const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.ARQUITECTO, userId: mainProjectManagerId, projectId}})
                const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage);
                if (commissionPaymentRecord) {
                    await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                        commissionPercentage: element.commissionPercentage,
                        commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                        projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                        balance: commissionAmount
                    });
                } else {
                    const body = {
                        userId: mainProjectManagerId,
                        projectId,
                        commissionPercentage: element.commissionPercentage,
                        commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                        projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                        type: AdvancePaymentTypeE.ARQUITECTO,
                        balance: commissionAmount
                    }
                    await this.commissionPaymentRecordRepository.create(body);
                }
            }
        }


        //Arquitecto
        if (isArchitect === true) {
            const {architectName, commissionPercentageArchitect} = quotation;
            const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.ARQUITECTO, userName: architectName, projectId}})
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentageArchitect)
            if (commissionPaymentRecord) {
                await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                    commissionPercentage: commissionPercentageArchitect,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    balance: commissionAmount
                });
            } else {
                const body = {
                    userName: architectName,
                    projectId,
                    commissionPercentage: commissionPercentageArchitect,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.ARQUITECTO,
                    balance: commissionAmount
                }
                await this.commissionPaymentRecordRepository.create(body);
            }

        }

        //Cliente referenciado
        if (isReferencedCustomer === true) {
            const {referenceCustomerId, commissionPercentagereferencedCustomer} = quotation;
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentagereferencedCustomer);
            const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.CLIENTE_REFERENCIADO, userId: referenceCustomerId, projectId}})
            if (commissionPaymentRecord) {
                await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                    commissionPercentage: commissionPercentagereferencedCustomer,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    balance: commissionAmount
                });
            } else {
                const body = {
                    userId: referenceCustomerId,
                    projectId,
                    commissionPercentage: commissionPercentagereferencedCustomer,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.CLIENTE_REFERENCIADO,
                    balance: commissionAmount
                }
                await this.commissionPaymentRecordRepository.create(body);

            }
        }

        //Project managers
        if (isProjectManager === true) {
            const quotationProjectManagers = await this.quotationProjectManagerRepository.find({where: {quotationId}, include: ['classificationPercentageMainpms']});
            for (const iterator of quotationProjectManagers) {
                const {classificationPercentageMainpms, userId} = iterator;
                for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                    const element = classificationPercentageMainpms[index];
                    const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.PROJECT_MANAGER, userId: userId, projectId}})
                    const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage);
                    if (commissionPaymentRecord) {
                        await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                            commissionPercentage: element.commissionPercentage,
                            commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                            projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                            balance: commissionAmount
                        });
                    } else {
                        const body = {
                            userId: userId,
                            projectId,
                            commissionPercentage: element.commissionPercentage,
                            commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                            projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                            type: AdvancePaymentTypeE.PROJECT_MANAGER,
                            balance: commissionAmount
                        }
                        await this.commissionPaymentRecordRepository.create(body);
                    }
                }
            }
        }

        //Showroom manager
        if (showroomManagerId) {
            const commissionPercentage = 16;
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentage);

            const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.SHOWROOM_MANAGER, userId: showroomManagerId, projectId}})
            if (commissionPaymentRecord) {
                await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                    commissionPercentage: commissionPercentage,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    balance: commissionAmount
                });
            } else {
                const body = {
                    userId: showroomManagerId,
                    projectId,
                    commissionPercentage: commissionPercentage,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.SHOWROOM_MANAGER,
                    balance: commissionAmount
                }
                await this.commissionPaymentRecordRepository.create(body);
            }


        }

        //Proyectistas
        if (isDesigner === true) {
            const QuotationDesigners = await this.quotationDesignerRepository.find({where: {quotationId}, include: ['classificationPercentageMainpms']});
            for (const iterator of QuotationDesigners) {
                const {classificationPercentageMainpms, userId} = iterator;
                for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                    const element = classificationPercentageMainpms[index];
                    const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage);
                    const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {type: AdvancePaymentTypeE.PROYECTISTA, userId: userId, projectId}})
                    if (commissionPaymentRecord) {
                        await this.commissionPaymentRecordRepository.updateById(commissionPaymentRecord.id, {
                            commissionPercentage: element.commissionPercentage,
                            commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                            projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                            balance: commissionAmount
                        });
                    } else {
                        const body = {
                            userId: userId,
                            projectId,
                            commissionPercentage: element.commissionPercentage,
                            commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                            projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                            type: AdvancePaymentTypeE.PROYECTISTA,
                            balance: commissionAmount
                        }
                        await this.commissionPaymentRecordRepository.create(body);
                    }
                }
            }
        }

    }

    async quotationShowRoomMaster(id: number, project: Project, data: UpdateQuotationProject) {
        const branchId = this.user.branchId;
        if (!branchId)
            throw this.responseService.badRequest("El usuario creacion no cuenta con una sucursal asignada.");
        const {quotation, products, branchesId} = data;
        await this.validateBodyQuotationShowroomMaster(data);
        try {
            const findQuotation = await this.findQuotationByIdMaster(id);
            await this.deleteProdcuts(findQuotation, products);
            await this.updateProducts(products, findQuotation.id, branchesId)
            await this.updateQuotationShowroomMaster(quotation, findQuotation.id, branchesId);

            await this.updatePdfToCustomer(project.quotationId, project.id);
            await this.updatePdfToProvider(project.quotationId, project.id);
            await this.updatePdfToAdvance(project.quotationId, project.id);
            return this.findQuotationById(id);
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async getSMShowRoom(branchId: number) {
        const sm = await this.userRepository.findOne({where: {branchId: branchId, isShowroomManager: true}});
        if (!sm || !sm?.id)
            throw this.responseService.badRequest("Aun no se encuentra un Showroom manager en tu equipo.");
        return sm.id;
    }

    async validateBrancId(branchesId: number[]) {
        for (let index = 0; index < branchesId?.length; index++) {
            const element = branchesId[index];
            const branch = await this.branchRepository.findOne({where: {id: element}});
            if (!branch)
                throw this.responseService.notFound('La sucursal no existe.')

        }
    }

    async validateBodyQuotationShowroom(data: CreateQuotation) {
        try {
            await schemaCreateQuotitionShowRoom.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyQuotationShowroomMaster(data: UpdateQuotationProject) {
        try {
            await schemaCreateQuotitionShowRoomMaster.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async createQuatationShowRoom(quotation: QuotationI, isDraft: boolean, userId: number, branchesId: number[], showroomManagerId: number, showRoomDestination: ShowRoomDestinationE, branchId: number) {
        const data = this.convertExchangeRateQuotation(quotation);
        const dayExchangeRate = await this.dayExchancheCalculateToService.getdayExchangeRatAll();
        const bodyQuotation = {
            ...data,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            isDraft,
            branchesId,
            userId,
            typeQuotation: TypeQuotationE.SHOWROOM,
            showroomManagerId,
            mainProjectManagerId: this.user.id,
            showRoomDestination,
            branchId,
            ...dayExchangeRate
        }
        return this.quotationRepository.create(bodyQuotation);
    }

    async createProducts(products: QuotationProductsCreate[], quotationId: number, branchesId: number[]) {
        for (const element of products) {
            const product = await this.productRepository.findOne({where: {id: element.productId}});
            if (product) {
                const {mainMaterialImg, mainFinishImg, secondaryMaterialImg, secondaryFinishingImag, document} = element
                delete element.mainMaterialImg;
                delete element.mainFinishImg;
                delete element.secondaryMaterialImg;
                delete element.secondaryFinishingImag;
                delete element.document;
                // const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, dateReservationDays: element?.reservationDays ? dayjs().add(element?.reservationDays, 'days').toDate() : undefined, isNotificationSent: element?.reservationDays ? false : undefined, typeQuotation: TypeQuotationE.SHOWROOM, branchesId},);
                const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, typeQuotation: TypeQuotationE.SHOWROOM, branchesId},);
                await this.createDocumentProduct(response.productId, document)
                await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                await this.createDocumentMainFinish(response.id, mainFinishImg);
                await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
            }
        }
    }

    async deleteProdcuts(quotation: Quotation, products: QuotationProductsCreate[]) {
        const {id} = quotation;
        const productsMap = products.map((value) => value.productId);
        const productsDelete = quotation.products?.filter((value) => !productsMap.includes(value?.id ?? 0)) ?? []
        for (const element of productsDelete) {
            await this.quotationRepository.products(id).unlink(element.id)
        }
    }

    async updateProducts(products: QuotationProductsCreate[], quotationId: number, branchesId: number[]) {
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
                    element.isNotificationSent = element?.reservationDays ? false : undefined
                    await this.quotationProductsRepository.updateById(findQuotationP.id, {...element, branchesId});
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
                    // const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost});
                    // const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, dateReservationDays: element?.reservationDays ? dayjs().add(element?.reservationDays, 'days').toDate() : undefined, isNotificationSent: element?.reservationDays ? false : undefined, branchesId},);
                    const response = await this.quotationProductsRepository.create({...element, quotationId, brandId: product.brandId, price: element.factor * element.originCost, branchesId, typeQuotation: TypeQuotationE.SHOWROOM},);
                    await this.createDocumentProduct(response.productId, document)
                    await this.createDocumentMainMaterial(response.id, mainMaterialImg)
                    await this.createDocumentMainFinish(response.id, mainFinishImg);
                    await this.createDocumentSecondaryMaterial(response.id, secondaryMaterialImg);
                    await this.createDocumentSecondaryFinishingImage(response.id, secondaryFinishingImag);
                }
            }
        }
    }

    async updateQuotationShowroom(quotation: QuotationI, isDraft: boolean, userId: number, quotationId: number, showRoomDestination: ShowRoomDestinationE, branchesId: number[]) {
        const data = this.convertExchangeRateQuotation(quotation);
        const bodyQuotation = {
            ...data,
            status: isDraft ? StatusQuotationE.ENPROCESO : StatusQuotationE.ENREVISIONSM,
            isDraft,
            userId,
            showRoomDestination,
            branchesId,
        }
        await this.quotationRepository.updateById(quotationId, bodyQuotation)
    }

    async updateQuotationShowroomMaster(quotation: UpdateQuotationI, quotationId: number, branchesId: number[]) {
        const data = this.convertExchangeRateQuotationMaster(quotation);
        const bodyQuotation = {
            ...data,
            branchesId,
        }
        await this.quotationRepository.updateById(quotationId, bodyQuotation)
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
        // let where: any = {status: {neq: StatusQuotationE.CERRADA}};
        let where: any = {};
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
                relation: 'branches',
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
            const {id, customer, projectManagers, exchangeRateQuotation, status, updatedAt, branch, mainProjectManager, mainProjectManagerId, typeQuotation} = value;
            const {total} = this.getPricesQuotation(value);
            return {
                id,
                customerName: customer?.name,
                pm: mainProjectManager ? `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}` : '',
                pmId: mainProjectManagerId,
                branchId: branch?.id ?? null,
                total,
                branchName: branch?.name ?? null,
                status,
                updatedAt,
                typeQuotation
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
                relation: 'clientQuote',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id', 'clientQuoteId']
                }
            },
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
                relation: 'quotationProductsStocks',
                scope: {
                    include: [
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

        for (const element of quotation?.quotationProductsStocks ?? []) {
            const {quotationProducts: iterator} = element;
            const {line, name, document, brand} = iterator.product;
            products.push({
                ...iterator,
                SKU: iterator?.SKU,
                brandName: iterator?.brand?.brandName ?? '',
                status: iterator.status,
                description: `${line?.name} ${name} ${iterator.mainMaterial} ${iterator.mainFinish} ${iterator.secondaryMaterial} ${iterator.secondaryFinishing} ${iterator.measureWide}`,
                image: document ? document?.fileURL : '',
                // quantity: iterator.quantity,
                // percentageDiscountProduct: iterator.percentageDiscountProduct,
                // discountProduct: iterator.discountProduct,
                percentageMaximumDiscount: iterator.percentageMaximumDiscount,
                maximumDiscount: iterator.maximumDiscount,
                // subtotal: iterator.subtotal,
                mainMaterialImage: iterator?.mainMaterialImage ?? null,
                mainFinishImage: iterator?.mainFinishImage ?? null,
                secondaryMaterialImage: iterator?.secondaryMaterialImage ?? null,
                secondaryFinishingImage: iterator?.secondaryFinishingImage ?? null,
                line: line,
                brand: brand,
                document: document,
                discountProduct: element?.discountProduct,
                quantity: element?.quantity,
                originCost: element?.originCost,
                price: element?.price,
                factor: element?.factor,
                subtotal: element?.subtotal,
                percentageDiscountProduct: element?.percentageDiscountProduct,
                subtotalDiscount: element?.subtotalDiscount,
                typeSale: element?.typeSale,
                reservationDays: element?.reservationDays,
                loanInitialDate: element?.loanInitialDate,
                loanEndDate: element?.loanEndDate,
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
                customerId: quotation?.customerId,
                firstName: quotation?.customer?.name,
                lastName: quotation?.customer?.lastName,
                secondLastName: quotation?.customer?.secondLastName,
                address: quotation?.customer?.address,
                addressDescription: quotation?.customer?.addressDescription,
                phone: quotation?.customer?.phone,
                invoice: quotation?.customer?.invoice,
                rfc: quotation?.customer?.rfc,
                businessName: quotation?.customer?.businessName,
                regimen: quotation?.customer?.regimen,
                group: quotation?.customer?.group?.name,
                groupId: quotation?.customer?.groupId,
                email: quotation?.customer?.email
            },
            products: products,
            quotation: {
                clientQuote: quotation?.clientQuote ?? null,
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
                typeQuotation: quotation?.typeQuotation,
                branchId: quotation?.branchId,
                showRoomDestination: quotation?.showRoomDestination,
                branchesId: quotation?.branchesId
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
            // await this.deleteManyQuotation(findQuotation, projectManagers, designers, products);
            // await this.updateManyQuotition(projectManagers, designers, products, findQuotation.id);
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
        if (quotation.typeQuotation === TypeQuotationE.GENERAL) {
            await this.validateIfExistCustomer(quotation);
        }
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
                prices = await this.calculatePricesExchangeRate(quotation, typeFractional);
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

    async createDayExchangeRates(id: number, dayExchangeRate: Omit<DayExchangeRate, 'id'>,) {
        await this.quotationRepository.updateById(id, {...dayExchangeRate});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});

    }

    async geteDayExchangeRates(id: number) {
        const {euroToPeso, euroToDolar, dolarToPeso, dolarToEuro, mxnToEuro, mxnToDolar} = await this.quotationRepository.findById(id)
        return {
            id,
            euroToPeso,
            euroToDolar,
            dolarToPeso,
            dolarToEuro,
            mxnToEuro,
            mxnToDolar
        }

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
                console.log(this.user.isMaster)
                if (quotation?.typeQuotation === TypeQuotationE.GENERAL && this.user.isMaster === false) {
                    await this.validateAdvanceCustomerAndEnsamblado(id);
                }
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



    async calculatePricesExchangeRate(quotation: Quotation, typeFractional: {EUR: boolean, MXN: boolean, USD: boolean}) {
        //CAMBIAR TIPO DE MONEDA URGENTE
        const {exchangeRateQuotation} = quotation;
        if (exchangeRateQuotation == ExchangeRateQuotationE.EUR) {
            let bodyMXN = {};
            let bodyUSD = {};
            const {USD, MXN} = await this.dayExchancheCalculateToService.getdayExchangeRateEuroToQuotation(quotation.id);
            // const USD = 1.074;
            // const MXN = 19.28;
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

    async updateQuotationProject(id: number, data: UpdateQuotationProject,) {
        try {

            const project = await this.projectRepository.findOne({where: {id}})
            if (!project)
                return this.responseService.notFound('El proyecto no se ha encontrado.')

            if (project.status === ProjectStatusE.CERRADO)
                return this.responseService.badRequest("El proyecto ha sido cerrado y no es posible realizar actualizaciones.");

            const {quotation, products, productsStock, typeQuotation} = data;

            if (typeQuotation === TypeQuotationE.GENERAL) {

                await this.validateBodyQuotationProject(data);

                const findQuotation = await this.findQuotationById(project.quotationId);

                await this.updateQuotationProjectMaster(quotation, project.quotationId);
                await this.deleteManyQuotationMaster(findQuotation, products, productsStock);
                await this.updateManyQuotitionMaster(products, findQuotation.id, productsStock);

                const quotationUpdate = await this.findQuotationProjectById(project.quotationId);
                await this.updateAdvancePaymentRecord(quotationUpdate, project.quotationId, project.id);

                await this.updatePdfToCustomer(project.quotationId, project.id);
                await this.updatePdfToProvider(project.quotationId, project.id);
                await this.updatePdfToAdvance(project.quotationId, project.id);

                return this.findQuotationById(project.quotationId);
            } else {
                return this.quotationShowRoomMaster(project.quotationId, project, data);
            }

        } catch (error) {
            return this.responseService.badRequest(error?.message ?? error);
        }
    }

    convertExchangeRateQuotationMaster(quotation: UpdateQuotationI) {
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

    async updatePdfToCustomer(quotationId: number, projectId: number) {
        const quotation = await this.quotationRepository.findById(quotationId, {
            include: [
                {
                    relation: 'quotationProductsStocks',
                    scope: {
                        include: [
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
                        ]
                    }
                },
                {relation: 'customer'}, {relation: "project"}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}]}}]
        });
        const {customer, mainProjectManager, referenceCustomer, products, project, quotationProductsStocks} = quotation;
        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`
        let productsTemplate = [];
        for (const product of products) {
            const {brand, document, quotationProducts, line, name} = product;
            const descriptionParts = [
                line?.name,
                name,
                quotationProducts?.mainMaterial,
                quotationProducts?.mainFinish,
                quotationProducts?.secondaryMaterial,
                quotationProducts?.secondaryFinishing
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            const measuresParts = [
                quotationProducts?.measureWide ? `Ancho: ${quotationProducts?.measureWide}` : "",
                quotationProducts?.measureHigh ? `Alto: ${quotationProducts?.measureHigh}` : "",
                quotationProducts?.measureDepth ? `Prof: ${quotationProducts?.measureDepth}` : "",
                quotationProducts?.measureCircumference ? `Circ: ${quotationProducts?.measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            productsTemplate.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProducts?.mainFinish,
                mainFinishImage: quotationProducts?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: quotationProducts?.quantity,
                percentage: quotationProducts?.percentageDiscountProduct,
                subtotal: quotationProducts?.subtotal,
                currencyEuro: quotationProducts?.currency === CurrencyE.EURO,
                currencyUSD: quotationProducts?.currency === CurrencyE.USD,
                currencyPesoMexicano: quotationProducts?.currency === CurrencyE.PESO_MEXICANO,
            })
        }
        for (const iterator of quotationProductsStocks ?? []) {
            const {quotationProducts} = iterator;
            const {product} = quotationProducts;
            const {line, document, brand} = product;
            const descriptionParts = [
                line?.name,
                product?.name,
                quotationProducts?.mainMaterial,
                quotationProducts?.mainFinish,
                quotationProducts?.secondaryMaterial,
                quotationProducts?.secondaryFinishing
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            const measuresParts = [
                quotationProducts?.measureWide ? `Ancho: ${quotationProducts?.measureWide}` : "",
                quotationProducts?.measureHigh ? `Alto: ${quotationProducts?.measureHigh}` : "",
                quotationProducts?.measureDepth ? `Prof: ${quotationProducts?.measureDepth}` : "",
                quotationProducts?.measureCircumference ? `Circ: ${quotationProducts?.measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            productsTemplate.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProducts?.mainFinish,
                mainFinishImage: quotationProducts?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: iterator?.quantity,
                percentage: iterator?.percentageDiscountProduct,
                subtotal: iterator?.subtotal,
                currencyEuro: quotationProducts?.currency === CurrencyE.EURO,
                currencyUSD: quotationProducts?.currency === CurrencyE.USD,
                currencyPesoMexicano: quotationProducts?.currency === CurrencyE.PESO_MEXICANO,
            })
        }
        const {subtotal, additionalDiscount, percentageIva, iva, total, advance, exchangeRate, balance, percentageAdditionalDiscount, advanceCustomer, conversionAdvance, percentageAdvance} = this.getPricesQuotation(quotation);
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`
        try {
            const reference = `${project?.reference ?? ""}`
            const referenceCustomerName = reference.trim() === "" ? "-" : reference
            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": referenceCustomerName,
                "products": productsTemplate,
                subtotal,
                percentageAdditionalDiscount: percentageAdditionalDiscount ?? 0,
                additionalDiscount,
                percentageIva,
                iva,
                total,
                advance,
                advanceCustomer: exchangeRate == 'EUR' ? convertToMoneyEuro(advanceCustomer ?? 0) : convertToMoney(advanceCustomer ?? 0),
                conversionAdvance: convertToMoneyEuro(conversionAdvance ?? 0),
                balance: convertToMoneyEuro(balance ?? 0),
                exchangeRate,
                percentageAdvance,
                emailPM: mainProjectManager?.email,
                isTypeQuotationGeneral: quotation.typeQuotation === TypeQuotationE.GENERAL

            }
            let nameFile = `cotizacion_cliente_${customer ? customer?.name : ''}-${customer ? customer?.lastName : ''}_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            if (quotation.typeQuotation === TypeQuotationE.SHOWROOM)
                nameFile = `showroom_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/cotizacion_cliente.html`, properties, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
            await this.projectRepository.clientQuoteFile(projectId).delete();
            await this.projectRepository.clientQuoteFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'})
        } catch (error) {
            console.log('error: ', error)
        }
    }

    async updatePdfToProvider(quotationId: number, projectId: number) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: "project"}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}, {relation: 'assembledProducts', scope: {include: ['document']}}]}}]});
        const {customer, mainProjectManager, referenceCustomer, products, project} = quotation;
        console.log("QUOTATION", quotation);

        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`
        //aqui
        let prodcutsArray = [];
        for (const product of products) {
            const {brand, document, quotationProducts, typeArticle, assembledProducts, line, name} = product;
            const descriptionParts = [
                line?.name,
                name,
                quotationProducts?.mainMaterial,
                quotationProducts?.mainFinish,
                quotationProducts?.secondaryMaterial,
                quotationProducts?.secondaryFinishing
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            const measuresParts = [
                quotationProducts?.measureWide ? `Ancho: ${quotationProducts?.measureWide}` : "",
                quotationProducts?.measureHigh ? `Alto: ${quotationProducts?.measureHigh}` : "",
                quotationProducts?.measureDepth ? `Prof: ${quotationProducts?.measureDepth}` : "",
                quotationProducts?.measureCircumference ? `Circ: ${quotationProducts?.measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            prodcutsArray.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProducts?.mainFinish,
                mainFinishImage: quotationProducts?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: quotationProducts?.quantity,
                typeArticle: TypeArticleE.PRODUCTO_ENSAMBLADO === typeArticle ? true : false,
                originCode: quotationProducts?.originCode,
                originCost:
                    quotationProducts?.originCost
                        ? `${quotationProducts?.originCost.toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                        })}`.replace('$', '€')
                        : '€0.00',
                assembledProducts: quotationProducts?.assembledProducts ?? [],
            })
        }
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`
        try {
            const reference = `${project?.reference ?? ""}`
            const referenceCustomerName = reference.trim() === "" ? "-" : reference

            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": referenceCustomerName,
                "products": prodcutsArray,
                "type": 'COTIZACION',
                isTypeQuotationGeneral: quotation.typeQuotation === TypeQuotationE.GENERAL
            }
            const nameFile = `Orden-de-compra_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/cotizacion_proveedor.html`, properties, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
            await this.projectRepository.providerFile(projectId).delete();
            await this.projectRepository.providerFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'})
        } catch (error) {
            console.log('error: ', error)
        }
    }


    async updatePdfToAdvance(quotationId: number, projectId: number) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'proofPaymentQuotations', scope: {order: ['createdAt ASC'], }}]});
        const {customer, mainProjectManager, referenceCustomer} = quotation;
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`

        const advancePaymentRecord = await this.advancePaymentRecordRepository.find({where: {projectId}})
        try {
            const propertiesGeneral: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
            }
            for (let index = 0; index < advancePaymentRecord?.length; index++) {
                const {paymentDate, amountPaid, parity, currencyApply, paymentMethod, conversionAmountPaid, paymentCurrency, reference} = advancePaymentRecord[index];

                let letterNumber = this.letterNumberService.convertNumberToWords(amountPaid)
                letterNumber = `${letterNumber} ${this.separeteDecimal(amountPaid)}/100 MN`;

                const propertiesAdvance: any = {
                    ...propertiesGeneral,
                    advanceCustomer: paymentCurrency == 'MXN' ? convertToMoney(amountPaid) : convertToMoneyEuro(amountPaid),
                    conversionAdvance: paymentCurrency == 'MXN' ? convertToMoney(conversionAmountPaid).replace('$', '') : convertToMoneyEuro(conversionAmountPaid).replace('€', ''),
                    proofPaymentType: paymentCurrency,
                    paymentType: paymentMethod,
                    exchangeRateAmount: parity,
                    paymentDate: dayjs(paymentDate).format('DD/MM/YYYY'),
                    letterNumber,
                    consecutiveId: (index + 1),
                    reference
                }

                const nameFile = `recibo_anticipo_${paymentCurrency}_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
                await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/recibo_anticipo.html`, propertiesAdvance, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
                await this.projectRepository.advanceFile(projectId).delete();
                await this.projectRepository.advanceFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'})
            }

        } catch (error) {
            console.log('error: ', error)
        }
    }

    separeteDecimal(amountPaid: number) {
        const decimalAarray = amountPaid.toString().split('.');
        const decimalString = decimalAarray[1] ? decimalAarray[1].toString() : '00';
        return decimalString
    }


    getTotalQuotation(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                return quotation.totalEUR;
                break;
            case ExchangeRateQuotationE.MXN:
                return quotation.totalMXN;

                break;
            case ExchangeRateQuotationE.USD:
                return quotation.totalUSD;
                break;
        }
    }

    bigNumberDividedBy(price: number, value: number): number {
        return Number(new BigNumber(price).dividedBy(new BigNumber(value)));
    }

    calculateCommissionAmount(exchangeRateQuotation: ExchangeRateQuotationE, quotation: Quotation, commissionPercentage: number) {
        switch (exchangeRateQuotation) {
            case ExchangeRateQuotationE.EUR:
                const commisionEUR = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalEUR, commisionEUR)
                break;
            case ExchangeRateQuotationE.MXN:
                const commisionMXN = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalMXN, commisionMXN)

                break;
            case ExchangeRateQuotationE.USD:
                const commisionUSD = this.bigNumberDividedBy(commissionPercentage, 100);
                return this.bigNumberMultipliedBy(quotation.totalUSD, commisionUSD)

                break;

            default:
                break;
        }
    }

    async findQuotationProjectById(id: number) {
        const quotation = await this.quotationRepository.findOne({
            where: {id}, include: [{
                relation: 'proofPaymentQuotations',
                scope: {
                    order: ['createdAt ASC'],
                    include: ['documents']
                }
            }, {
                relation: 'classificationPercentageMainpms'
            },
            {
                relation: 'showroomManager'
            }]
        });
        if (!quotation)
            throw this.responseService.badRequest('La cotizacion no existe.');
        return quotation
    }

    async updateAdvancePaymentRecord(quotation: Quotation, quotationId: number, projectId: number) {
        // const quotation = await this.findQuotationProjectById(quotationId);
        const {proofPaymentQuotations, exchangeRateQuotation, percentageIva, customerId, id, createdAt, isFractionate, typeFractional} = quotation;
        if (isFractionate) {
            if (typeFractional.EUR == true) {
                const {totalEUR, advanceEUR} = quotation;
                // const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalEUR ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalEUR ?? 0, typeCurrency: ExchangeRateQuotationE.EUR});
                const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {quotationId: id, projectId, typeCurrency: ExchangeRateQuotationE.EUR}})
                if (accountsReceivable) {
                    if (totalEUR > (accountsReceivable?.totalSale ?? 0)) {
                        await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalEUR ?? 0, isPaid: false})
                    } else {
                        if (accountsReceivable.totalPaid >= totalEUR) {
                            await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalEUR ?? 0, isPaid: true})
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)
                        } else {
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)

                        }
                    }
                }
            }

            if (typeFractional.MXN == true) {
                const {totalMXN, ivaMXN} = quotation;
                // const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalMXN ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalMXN ?? 0, typeCurrency: ExchangeRateQuotationE.MXN});
                const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {quotationId: id, projectId, typeCurrency: ExchangeRateQuotationE.MXN}})
                if (accountsReceivable) {
                    if (totalMXN > (accountsReceivable?.totalSale ?? 0)) {
                        await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalMXN ?? 0, isPaid: false})
                    } else {
                        if (accountsReceivable.totalPaid >= totalMXN) {
                            await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalMXN ?? 0, isPaid: true})
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)
                        } else {
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)

                        }
                    }
                }
            }

            if (typeFractional.USD == true) {
                const {totalUSD, ivaUSD} = quotation;
                // const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalUSD ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalUSD ?? 0, typeCurrency: ExchangeRateQuotationE.USD});
                const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {quotationId: id, projectId, typeCurrency: ExchangeRateQuotationE.USD}})
                if (accountsReceivable) {
                    if (totalUSD > (accountsReceivable?.totalSale ?? 0)) {
                        await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalUSD ?? 0, isPaid: false})
                    } else {
                        if (accountsReceivable.totalPaid >= totalUSD) {
                            await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: totalUSD ?? 0, isPaid: true})
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)
                        } else {
                            await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)

                        }
                    }
                }
            }
        } else {
            const {total, iva, exchangeRate} = this.getPricesQuotation(quotation);
            // const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: total ?? 0, totalPaid: 0, updatedTotal: 0, balance: total ?? 0, typeCurrency: exchangeRateQuotation});
            const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {quotationId: id, projectId, typeCurrency: exchangeRateQuotation}})
            if (accountsReceivable) {
                if ((total ?? 0) > (accountsReceivable?.totalSale ?? 0)) {
                    await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: total ?? 0, isPaid: false})
                } else {
                    if (accountsReceivable.totalPaid >= (total ?? 0)) {
                        await this.accountsReceivableRepository.updateById(accountsReceivable.id, {totalSale: total ?? 0, isPaid: true})
                        await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)
                    } else {
                        await this.createPurchaseOrders(projectId, accountsReceivable.id, accountsReceivable.totalPaid, accountsReceivable.typeCurrency)

                    }
                }
            }

        }
    }


    async createPurchaseOrders(projectId: number, accountsReceivableId: number, totalPaid: number, typeCurrency: string) {
        const findProjectQuotation = await this.findProjectQuotation(projectId)

        const {id: quotationId} = findProjectQuotation.quotation
        const {advance} = this.getPricesQuotation(findProjectQuotation.quotation);

        if (advance && totalPaid >= advance) {
            // await this.findProjectProforma(projectId, accountsReceivableId, quotationId, typeCurrency)
            await this.createPurchaseOrderPaid(projectId, accountsReceivableId, quotationId, typeCurrency);
        }
    }

    async findProjectQuotation(id: number) {

        const findProjectQuotation = await this.projectRepository.findOne({where: {id}, include: [{relation: "quotation"}]})
        if (!findProjectQuotation)
            throw this.responseService.badRequest("El proyecto no existe.");
        return findProjectQuotation
    }

    async createPurchaseOrderPaid(projectId: number, accountsReceivableId: number, quotationId: number, typeCurrency: string) {
        /**
         * Buscar dentro de cotizacion para sabes si es isFractionate
         * Si no es fraccionada
         * entonces buscares con un find las proformas donde el projectId
         * despues de consultar cada proforma traero su cuenta por pagar y buscare si la cuenta por pagar ya tiene una orden de compra, si no le voy a crear una
         *
         * Si es fraccionada
         * entonces tomare el typeCurrency de account-receible (cuenta por cobrar)
         * buscares con un find las proformas donde el projectId y el currency sea igual a typeCurrency de account-receible
         * me traera solo una proforma y su accoun payable (cuenta por pagar)
         * despues de consultar cada proforma traero su cuenta por pagar y buscare si la cuenta por pagar ya tiene una orden de compra, si no le voy a crear una
         */

        const quotation = await this.quotationRepository.findById(quotationId);
        if (quotation.isFractionate) {
            // const cuentaPorCobrar = await this.accountsReceivableRepository.findOne({where: {quotationId: quotation.id, typeCurrency}});
            const proforma = await this.proformaRepository.findOne({where: {projectId, currency: typeCurrency === ExchangeRateQuotationE.EUR ? ProformaCurrencyE.EURO : typeCurrency === ExchangeRateQuotationE.MXN ? ProformaCurrencyE.PESO_MEXICANO : ProformaCurrencyE.USD}, include: [{relation: "accountPayable"}, {relation: "purchaseOrders"}]})
            if (proforma && proforma?.accountPayable && !proforma?.purchaseOrders) {
                const purchaseorder = await this.purchaseOrdersRepository.create({accountPayableId: proforma.accountPayable.id, status: PurchaseOrdersStatus.NUEVA, proformaId: proforma.id, accountsReceivableId, projectId}, /*{transaction}*/)
                const findQuotationProducts = await this.quotationProductsRepository.find({
                    where: {
                        proformaId: proforma.id,
                        providerId: proforma.providerId,
                        brandId: proforma.brandId
                    }
                })
                for (let index = 0; index < findQuotationProducts?.length; index++) {
                    const element = findQuotationProducts[index];
                    await this.quotationProductsRepository.updateById(element.id, {purchaseOrdersId: purchaseorder.id});
                }
            }
        } else {
            const proformas = await this.proformaRepository.find({where: {projectId}, include: [{relation: "accountPayable"}, {relation: "purchaseOrders"}]})
            for (let index = 0; index < proformas.length; index++) {
                const element = proformas[index];
                if (element && element?.accountPayable && !element?.purchaseOrders) {
                    const purchaseorder = await this.purchaseOrdersRepository.create({accountPayableId: element.accountPayable.id, status: PurchaseOrdersStatus.NUEVA, proformaId: element.id, accountsReceivableId, projectId}, /*{transaction}*/)
                    const findQuotationProducts = await this.quotationProductsRepository.find({
                        where: {
                            proformaId: element.id,
                            providerId: element.providerId,
                            brandId: element.brandId
                        }
                    })
                    for (let index = 0; index < findQuotationProducts?.length; index++) {
                        const element = findQuotationProducts[index];
                        await this.quotationProductsRepository.updateById(element.id, {purchaseOrdersId: purchaseorder.id});
                    }
                }
            }
        }

    }

    async updateQuotationProjectMaster(quotation: UpdateQuotationI, quotationId: number,) {
        const data = this.convertExchangeRateQuotationMaster(quotation);
        const bodyQuotation = {
            ...data,
        }
        await this.quotationRepository.updateById(quotationId, bodyQuotation)
    }

    async validateCustomer(customerId: number) {
        const customer = await this.customerRepository.findOne({where: {id: customerId}});
        if (!customer)
            throw this.responseService.notFound('El cliente no se ha encontrado.')
    }

    async validateBodyQuotationProject(data: UpdateQuotationProject) {
        try {
            await schemaUpdateQuotitionProject.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

}
