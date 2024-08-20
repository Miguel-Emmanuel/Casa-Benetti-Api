import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import fs from "fs/promises";
import {AccessLevelRolE, AdvancePaymentTypeE, ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE, PurchaseOrdersStatus, QuotationProductStatusE, TypeAdvancePaymentRecordE, TypeArticleE, TypeQuotationE} from '../enums';
import {convertToMoney} from '../helpers/convertMoney';
import {schemaDeliveryRequest} from '../joi.validation.ts/delivery-request.validation';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {ProformaWithRelations, Project, Quotation, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {AccountPayableRepository, AccountsReceivableRepository, AdvancePaymentRecordRepository, BranchRepository, CommissionPaymentRecordRepository, DeliveryRequestRepository, DocumentRepository, ProformaRepository, ProjectRepository, PurchaseOrdersRepository, QuotationDesignerRepository, QuotationProductsRepository, QuotationProjectManagerRepository, QuotationRepository, UserRepository} from '../repositories';
import {LetterNumberService} from './letter-number.service';
import {PdfService} from './pdf.service';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProjectService {
    constructor(
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(AdvancePaymentRecordRepository)
        public advancePaymentRecordRepository: AdvancePaymentRecordRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProjectManagerRepository)
        public quotationProjectManagerRepository: QuotationProjectManagerRepository,
        @repository(QuotationDesignerRepository)
        public quotationDesignerRepository: QuotationDesignerRepository,
        @repository(BranchRepository)
        public branchRepository: BranchRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @service()
        public pdfService: PdfService,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
        @service()
        public letterNumberService: LetterNumberService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
        @repository(AccountPayableRepository)
        public accountPayableRepository: AccountPayableRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository,
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(UserRepository)
        public userRepository: UserRepository,
        @inject(RestBindings.Http.RESPONSE)
        private response: Response,
    ) { }

    async create(body: {quotationId: number}, transaction: any) {
        const {quotationId} = body;
        const quotation = await this.findQuotationById(quotationId);
        const project = await this.createProject({quotationId, branchId: quotation.branchId, customerId: quotation?.customerId}, quotation.showroomManager.firstName, transaction);
        await this.changeStatusProductsToPedido(quotationId, transaction);
        await this.updateSKUProducts(quotationId, project.reference, transaction);
        if (quotation?.typeQuotation === TypeQuotationE.GENERAL) {
            await this.createAdvancePaymentRecord(quotation, project.id, project.reference, transaction)
            await this.createCommissionPaymentRecord(quotation, project.id, quotationId, transaction)
        }
        await this.createPdfToCustomer(quotationId, project.id, transaction);
        await this.createPdfToProvider(quotationId, project.id, transaction);
        await this.createPdfToAdvance(quotationId, project.id, transaction);
        return project;

    }

    async count(where?: Where<Project>,) {
        return this.projectRepository.count(where);
    }
    async getProducts(projectId: number) {
        const project = await this.projectRepository.findById(projectId, {
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'quotationProducts'],
                        include: [
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    fields: ['id', 'quotationId', 'SKU', 'brandId', 'price', 'mainMaterial', 'mainFinish', 'secondaryMaterial', 'secondaryFinishing', 'measureWide', 'providerId', 'productId', 'proformaPrice'],
                                    include: [
                                        {
                                            relation: 'provider'
                                        },
                                        {
                                            relation: 'product',
                                            scope: {
                                                fields: ['id', 'name', 'lineId', 'document'],
                                                include: [
                                                    {
                                                        relation: 'line',
                                                        scope: {
                                                            fields: ['id', 'name']
                                                        }
                                                    },
                                                    {
                                                        relation: 'document',
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            relation: 'brand',
                                            scope: {
                                                fields: ['id', 'brandName']
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });
        const {quotation} = project;
        const {quotationProducts} = quotation;
        return quotationProducts.map(value => {

            const {id, SKU, product, price, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, measureWide, provider, providerId, brandId, brand, proformaPrice, measureHigh, measureDepth, measureCircumference} = value;
            const {name, line, document} = product;
            const descriptionParts = [
                line?.name,
                name,
                mainMaterial,
                mainFinish,
                secondaryMaterial,
                secondaryFinishing
            ];
            const measuresParts = [
                measureWide ? `Ancho: ${measureWide}` : "",
                measureHigh ? `Alto: ${measureHigh}` : "",
                measureDepth ? `Prof: ${measureDepth}` : "",
                measureCircumference ? `Circ: ${measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            return {
                id,
                SKU,
                provider: provider?.name ?? '',
                providerId,
                name,
                brand: brand?.brandName ?? '',
                brandId,
                price,
                description,
                measures,
                proformaPrice: proformaPrice ?? null,
                image: document?.fileURL
            }
        })
    }

    async getProductsInventories(projectId: string) {
        const project = await this.projectRepository.findOne({
            where: {projectId},
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'quotationProducts'],
                        include: [
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    fields: ['id', 'quotationId', 'SKU', 'brandId', 'price', 'mainMaterial', 'mainFinish', 'secondaryMaterial', 'secondaryFinishing', 'measureWide', 'providerId', 'productId', 'proformaPrice'],
                                    include: [
                                        {
                                            relation: 'provider'
                                        },
                                        {
                                            relation: 'product',
                                            scope: {
                                                fields: ['id', 'name', 'lineId', 'document'],
                                                include: [
                                                    {
                                                        relation: 'line',
                                                        scope: {
                                                            fields: ['id', 'name']
                                                        }
                                                    },
                                                    {
                                                        relation: 'document',
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            relation: 'brand',
                                            scope: {
                                                fields: ['id', 'brandName']
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });
        if (!project)
            throw this.responseService.notFound("El proyecto no se ha encontrado.")

        const {quotation} = project;
        const {quotationProducts} = quotation;
        return quotationProducts.map(value => {

            const {id, SKU, product, price, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, measureWide, provider, providerId, brandId, brand, proformaPrice, measureHigh, measureDepth, measureCircumference} = value;
            const {name, line, document} = product;
            const descriptionParts = [
                line?.name,
                name,
                mainMaterial,
                mainFinish,
                secondaryMaterial,
                secondaryFinishing
            ];
            const measuresParts = [
                measureWide ? `Ancho: ${measureWide}` : "",
                measureHigh ? `Alto: ${measureHigh}` : "",
                measureDepth ? `Prof: ${measureDepth}` : "",
                measureCircumference ? `Circ: ${measureCircumference}` : ""
            ];
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio

            return {
                id,
                SKU,
                provider: provider?.name ?? '',
                providerId,
                name,
                brand: brand?.brandName ?? '',
                brandId,
                price,
                description,
                measures,
                proformaPrice: proformaPrice ?? null,
                image: document?.fileURL
            }
        })
    }

    async getPurchaseOrdersByProjectId(id: number) {
        try {
            const project = await this.projectRepository.findById(id, {
                include: [
                    {
                        relation: 'proformas',
                        scope: {
                            include: [
                                {
                                    relation: 'purchaseOrders',
                                    scope: {
                                        include: [
                                            {
                                                relation: 'collection',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'container'
                                                        }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    relation: 'provider'
                                },
                                {
                                    relation: 'brand'
                                },
                                {
                                    relation: 'accountPayable'
                                },
                                {
                                    relation: 'quotationProducts',
                                    scope: {
                                        include: [
                                            {
                                                relation: 'product',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'document'
                                                        },
                                                        {
                                                            relation: 'line'
                                                        }
                                                    ]
                                                }
                                            }
                                        ],
                                    }
                                }
                            ]
                        }
                    }
                ]
            })
            const {proformas} = project
            return proformas?.map((value: ProformaWithRelations) => {
                const {purchaseOrders, provider, brand, accountPayable, proformaId, quotationProducts} = value;
                if (purchaseOrders) {
                    const {id: purchaseOrderId, status, productionEndDate, productionRealEndDate, collection, arrivalDate} = purchaseOrders;
                    return {
                        id: purchaseOrderId,
                        providerName: `${provider.name}`,
                        brandName: `${brand.brandName}`,
                        status,
                        accountPayableId: accountPayable.id,
                        proformaId,
                        productionEndDate: productionEndDate ?? null,
                        productionRealEndDate: productionRealEndDate ?? null,
                        containerNumber: collection?.container?.containerNumber ?? null,
                        arrivalDate: arrivalDate ?? null,
                        products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, quantity, originCost, proformaPrice, numberBoxes, status} = value;
                            const {document, line, name} = product;
                            const descriptionParts = [
                                line?.name,
                                name,
                                mainMaterial,
                                mainFinish,
                                secondaryMaterial,
                                secondaryFinishing
                            ];
                            const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                            return {
                                id: productId,
                                SKU,
                                image: document?.fileURL,
                                description,
                                quantity,
                                originCost,
                                proformaPrice,
                                proformaPriceQuantity: quantity * proformaPrice,
                                numberBoxes,
                                status
                            }
                        })
                    }
                }
            }).filter(value => value != null) ?? []
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }


    async getDeliveryBeValidated(id: number) {
        try {
            const proformas = await this.proformaRepository.find({
                where: {projectId: id}, include: [
                    {
                        relation: 'purchaseOrders',
                        scope: {
                            where: {
                                or: [
                                    // {
                                    //     status: PurchaseOrdersStatus.BODEGA_NACIONAL
                                    // },
                                    // {
                                    //     status: PurchaseOrdersStatus.ENTREGA_PARCIAL
                                    // },
                                ]
                            },

                        }
                    },
                    {
                        relation: 'quotationProducts',
                        scope: {
                            include: [
                                {
                                    relation: 'product',
                                    scope: {
                                        include: [
                                            {
                                                relation: 'document'
                                            },
                                            {
                                                relation: 'line'
                                            }
                                        ]
                                    }
                                }
                            ],
                            where: {
                                or: [
                                    // {
                                    //     status: QuotationProductStatusE.BODEGA_NACIONAL
                                    // },
                                    // {
                                    //     status: QuotationProductStatusE.SHOWROOM
                                    // },
                                ]
                            },
                        }
                    }
                ]
            })
            let purchaseOrdersRes = [];
            for (let index = 0; index < proformas.length; index++) {
                const {purchaseOrders, quotationProducts} = proformas[index];
                if (purchaseOrders) {
                    const {id: purchaseOrderId} = purchaseOrders;



                    purchaseOrdersRes.push({
                        id: purchaseOrderId,
                        products: quotationProducts.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing} = value;
                            const {document, line, name} = product;
                            const descriptionParts = [
                                line?.name,
                                name,
                                mainMaterial,
                                mainFinish,
                                secondaryMaterial,
                                secondaryFinishing
                            ];
                            const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                            return {
                                id,
                                description,
                                SKU,
                                image: document?.fileURL
                            }
                        })
                    })
                }
            }
            return purchaseOrdersRes;
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }

    }

    async postDeliveryRequest(data: {projectId: number, deliveryDay: string, comment: string, purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]}) {
        await this.validateBodyDeliveryRequest(data);
        const {projectId, purchaseOrders, deliveryDay, comment} = data;
        const projectRes = await this.findByIdProject(projectId);
        await this.validatePurchaseOrderas(purchaseOrders);
        const deliveryRequestCreate = await this.deliveryRequestRepository.create({deliveryDay, projectId, comment, customerId: projectRes.customerId})
        for (let index = 0; index < purchaseOrders.length; index++) {
            const {products, id: purchaseOrderId} = purchaseOrders[index];
            for (let index = 0; index < products.length; index++) {
                const {id, isSelected} = products[index];
                if (isSelected)
                    await this.quotationProductsRepository.updateById(id, {status: QuotationProductStatusE.ENTREGADO})
            }
            const searchSelected = products.filter(value => value.isSelected === true);


            if (products.length === searchSelected.length)
                await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.ENTREGA, deliveryRequestId: deliveryRequestCreate.id})
            else
                await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.ENTREGA_PARCIAL, deliveryRequestId: deliveryRequestCreate.id})
        }
        await this.notifyLogistics(projectId, deliveryDay);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async validatePurchaseOrderas(purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]) {
        for (let index = 0; index < purchaseOrders.length; index++) {
            const element = purchaseOrders[index];
            const where: any = {id: element.id, deliveryRequestId: {eq: null}}
            const purchaseOrder = await this.purchaseOrdersRepository.findOne({where});
            if (!purchaseOrder)
                throw this.responseService.badRequest(`La orden de compra ya se encuetra relacionada a una solicitud de entrega: ${element.id}`)
        }
    }
    async notifyLogistics(projectId: number, deliveryDay: string) {
        const project = await this.projectRepository.findById(projectId, {
            include: [
                {
                    relation: 'customer'
                },
                {
                    relation: 'quotation',
                    scope: {
                        include: [
                            {
                                relation: 'mainProjectManager'
                            }
                        ]
                    }
                }
            ]
        });
        const users = await this.userRepository.find({where: {isLogistics: true}})
        const emails = users.map(value => value.email);
        const {customer, quotation} = project;
        const {mainProjectManager} = quotation;
        const options = {
            to: emails,
            templateId: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC.id,
            dynamicTemplateData: {
                subject: SendgridTemplates.DELEVIRY_REQUEST_LOGISTIC.subject,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                projectId: project.projectId,
                mainPM: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                date: dayjs(deliveryDay).format('DD/MM/YYYY')
            }
        };
        await this.sendgridService.sendNotification(options);
    }

    async validateBodyDeliveryRequest(data: {projectId: number, deliveryDay: string, purchaseOrders: {id: number, products: {id: number, isSelected: boolean}[]}[]}) {
        try {
            await schemaDeliveryRequest.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async find(filter?: Filter<Project>,) {
        const accessLevel = this.user.accessLevel;
        let where: any = {};
        if (accessLevel === AccessLevelRolE.SUCURSAL) {
            where = {...where, branchId: this.user.branchId}
        }

        if (accessLevel === AccessLevelRolE.PERSONAL) {
            const quotations = (await this.quotationRepository.find({where: {mainProjectManagerId: this.user.id}})).map(value => value.id);
            where = {...where, quotationId: {inq: [...quotations]}}
        }

        if (filter?.where) {
            filter.where = {...filter.where, ...where}
        } else {
            filter = {...filter, where: {...where}};
        }

        const include = [
            {
                relation: 'quotation',
                scope: {
                    fields: ['id', 'mainProjectManagerId', 'mainProjectManager', 'customerId', 'branchId', 'exchangeRateQuotation', 'totalEUR', 'totalMXN', 'totalUSD', 'closingDate', 'mainProjectManagerId'],
                    include: [
                        {
                            relation: 'mainProjectManager',
                            scope: {
                                fields: ['id', 'firstName', 'lastName']
                            }
                        }
                    ]
                }
            },
            {
                relation: 'customer',
                scope: {
                    fields: ['id', 'name', 'lastName'],
                }
            },
            {
                relation: 'branch',
                scope: {
                    fields: ['id', 'name'],
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
                    ...include,
                ]
            };
        const projects = await this.projectRepository.find(filter);
        return projects.map(value => {
            const {id, projectId, customer, branch, quotation, status, branchId, reference} = value;
            const {mainProjectManager, exchangeRateQuotation, closingDate, mainProjectManagerId} = quotation;
            return {
                id,
                projectId,
                customerName: customer ? `${customer?.name} ${customer?.lastName ?? ''}` : null,
                projectManager: mainProjectManager ? `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}` : null,
                branch: branch?.name,
                total: this.getTotalQuotation(exchangeRateQuotation, quotation),
                status,
                closingDate,
                branchId,
                mainProjectManagerId,
                reference
            }
        })
    }

    async findById(id: number, filter?: FilterExcludingWhere<Project>) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'mainProjectManagerId', 'mainProjectManager', 'customerId', 'branchId', 'exchangeRateQuotation', 'totalEUR', 'totalMXN', 'totalUSD', 'closingDate', 'balanceMXN', 'balanceUSD', 'balanceEUR'],
                        include: [
                            {
                                relation: 'mainProjectManager',
                                scope: {
                                    fields: ['id', 'firstName', 'lastName']
                                }
                            },
                            {
                                relation: 'products',
                                scope: {
                                    include: ['brand', 'document', 'line', {relation: 'quotationProducts', scope: {include: ['mainMaterialImage', 'mainFinishImage', 'secondaryMaterialImage', 'secondaryFinishingImage']}}]
                                }
                            },
                        ]
                    }
                },
                {
                    relation: 'customer',
                    scope: {
                        fields: ['id', 'name', 'lastName'],
                    }
                },
                {
                    relation: 'advancePaymentRecords',
                    scope: {
                        include: [
                            {
                                relation: 'documents',
                                scope: {
                                    fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'advancePaymentRecordId']
                                }
                            }
                        ]
                    }
                },
                {
                    relation: 'clientQuoteFile',
                },
                {
                    relation: 'providerFile',
                },
                {
                    relation: 'advanceFile',
                },
                {
                    relation: 'documents',
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
                        ...include,
                    ]
                };
            const project = await this.projectRepository.findById(id, filter);
            const {customer, quotation, advancePaymentRecords, clientQuoteFile, providerFile, advanceFile, documents, reference} = project;
            const {closingDate, products, exchangeRateQuotation} = quotation;
            const {subtotal, additionalDiscount, percentageIva, iva, total, advance, exchangeRate, balance, percentageAdditionalDiscount, advanceCustomer, conversionAdvance} = this.getPricesQuotation(quotation);
            const productsArray = [];
            for (const iterator of products ?? []) {
                const descriptionParts = [
                    iterator?.line?.name,
                    iterator?.name,
                    iterator.quotationProducts?.mainMaterial,
                    iterator.quotationProducts?.mainFinish,
                    iterator.quotationProducts?.secondaryMaterial,
                    iterator.quotationProducts?.secondaryFinishing
                ];
                const measuresParts = [
                    iterator?.quotationProducts?.measureWide ? `Ancho: ${iterator?.quotationProducts?.measureWide}` : "",
                    iterator?.quotationProducts?.measureHigh ? `Alto: ${iterator?.quotationProducts?.measureHigh}` : "",
                    iterator?.quotationProducts?.measureDepth ? `Prof: ${iterator?.quotationProducts?.measureDepth}` : "",
                    iterator?.quotationProducts?.measureCircumference ? `Circ: ${iterator?.quotationProducts?.measureCircumference}` : ""
                ];

                const description = descriptionParts
                    .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                    .join(' ');  // Únelas con un espacio
                const measures = measuresParts
                    .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                    .join(' ');  // Únelas con un espacio
                productsArray.push({
                    id: iterator?.id,
                    image: iterator?.document ? iterator?.document?.fileURL : '',
                    brandName: iterator?.brand?.brandName ?? '',
                    description,
                    measures,
                    price: iterator?.quotationProducts?.price,
                    listPrice: iterator?.quotationProducts?.originCost,
                    factor: iterator?.quotationProducts?.factor,
                    quantity: iterator?.quotationProducts?.quantity,
                    // provider: iterator?.provider?.name,
                    status: iterator?.quotationProducts?.status,
                    mainFinish: iterator?.quotationProducts?.mainFinish,
                    mainFinishImage: iterator?.quotationProducts?.mainFinishImage?.fileURL,
                    secondaryFinishing: iterator?.quotationProducts?.secondaryFinishing,
                    secondaryFinishingImage: iterator?.quotationProducts?.secondaryFinishingImage?.fileURL,
                })
            }
            return {
                id,
                customerName: customer ? `${customer?.name} ${customer?.lastName}` : null,
                closingDate,
                total,
                totalPay: advanceCustomer,
                balance,
                products: productsArray,
                advancePaymentRecords: advancePaymentRecords?.map(value => {
                    const {documents, ...body} = value;
                    return {
                        ...body,
                        docs: documents
                    }
                }),
                exchangeRateQuotation,
                reference,
                files: {
                    clientQuoteFile: {
                        fileURL: clientQuoteFile?.fileURL,
                        name: clientQuoteFile?.name,
                        createdAt: clientQuoteFile?.createdAt,
                        extension: clientQuoteFile?.extension,
                    },
                    providerFile:
                    {
                        fileURL: providerFile?.fileURL,
                        name: providerFile?.name,
                        createdAt: providerFile?.createdAt,
                        extension: providerFile?.extension,
                    },
                    advanceFile: advanceFile?.map(value => {return {fileURL: value.fileURL, name: value?.name, createdAt: value?.createdAt, extension: value?.extension, }}),
                    documents: documents?.map(value => {return {fileURL: value.fileURL, name: value?.name, createdAt: value?.createdAt, id: value?.id, extension: value?.extension}}),
                }
            }
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async getDocuments(id: number) {
        const include: InclusionFilter[] = [
            {
                relation: 'clientQuoteFile',
            },
            {
                relation: 'providerFile',
            },
            {
                relation: 'advanceFile',
            },
            {
                relation: 'documents',
            },
        ]
        const project = await this.projectRepository.findById(id, {include: [...include]});
        const {clientQuoteFile, providerFile, advanceFile, documents} = project;
        return {
            id,
            clientQuoteFile: {
                fileURL: clientQuoteFile?.fileURL,
                name: clientQuoteFile?.name,
                createdAt: clientQuoteFile?.createdAt,
                extension: clientQuoteFile?.extension,
            },
            providerFile:
            {
                fileURL: providerFile?.fileURL,
                name: providerFile?.name,
                createdAt: providerFile?.createdAt,
                extension: providerFile?.extension,
            },
            advanceFile: advanceFile?.map(value => {return {fileURL: value.fileURL, name: value?.name, createdAt: value?.createdAt, extension: value?.extension, }}),
            documents: documents?.map(value => {return {fileURL: value.fileURL, name: value?.name, createdAt: value?.createdAt, id: value?.id, extension: value?.extension, }}),
        }
    }

    async updateById(id: number, project: Project,) {
        await this.projectRepository.updateById(id, project);
    }

    async uploadDocuments(id: number, data: {document: {fileURL: string, name: string, extension: string, id?: number}[]},) {
        await this.findByIdProject(id);
        const {document} = data
        for (let index = 0; index < document?.length; index++) {
            const element = document[index];
            if (element && !element?.id) {
                await this.projectRepository.documents(id).create(element);
            } else if (document) {
                await this.documentRepository.updateById(element.id, {...element});
            }
        }
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async findByIdProject(id?: number) {
        const project = await this.projectRepository.findOne({where: {id}});
        if (!project)
            throw this.responseService.notFound("El proyecto no se ha encontrado.")

        return project;
    }


    async createPdfToCustomer(quotationId: number, projectId: number, transaction: any) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: "project"}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}]}}]}, {transaction});
        const {customer, mainProjectManager, referenceCustomer, products, project} = quotation;
        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`
        console.log("QUOTATIONCUSTOMER", quotation);


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
                subtotal: quotationProducts?.subtotal
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
                advanceCustomer: convertToMoney(advanceCustomer ?? 0),
                conversionAdvance: convertToMoney(conversionAdvance ?? 0),
                balance: convertToMoney(balance ?? 0),
                exchangeRate,
                percentageAdvance,
                emailPM: mainProjectManager?.email

            }
            const nameFile = `cotizacion_cliente_${customer?.name}-${customer?.lastName}_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/cotizacion_cliente.html`, properties, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
            await this.projectRepository.clientQuoteFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'}, {transaction})
        } catch (error) {
            await transaction.rollback()
            console.log('error: ', error)
        }
    }

    async createPdfToProvider(quotationId: number, projectId: number, transaction: any) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: "project"}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}, {relation: 'assembledProducts', scope: {include: ['document']}}]}}]}, {transaction});
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
                assembledProducts: assembledProducts
            })
        }
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`
        try {
            const reference = `${project?.reference ?? ""}`
            const referenceCustomerName = reference.trim() === "" ? "-" : reference
            console.log("REFERENCE", {reference, referenceCustomerName});

            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": referenceCustomerName,
                "products": prodcutsArray,
                "type": 'COTIZACION'
            }
            const nameFile = `cotizacion_proveedor_${quotationId}_${dayjs().format('DD-MM-YYYY')}.pdf`
            await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/cotizacion_proveedor.html`, properties, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
            await this.projectRepository.providerFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'}, {transaction})
        } catch (error) {
            await transaction.rollback()
            console.log('error: ', error)
        }
    }


    async createPdfToAdvance(quotationId: number, projectId: number, transaction: any) {
        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'proofPaymentQuotations', scope: {order: ['createdAt ASC'], }}]});
        const {customer, mainProjectManager, referenceCustomer} = quotation;
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`

        const advancePaymentRecord = await this.advancePaymentRecordRepository.find({where: {projectId}}, {transaction})
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
                    advanceCustomer: amountPaid,
                    conversionAdvance: conversionAmountPaid ? conversionAmountPaid.toFixed(2) : 0,
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
                await this.projectRepository.advanceFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'}, {transaction})

            }

        } catch (error) {
            await transaction.rollback()
            console.log('error: ', error)
        }
        // try {
        //     const propertiesGeneral: any = {
        //         "logo": logo,
        //         "customerName": `${customer?.name} ${customer?.lastName}`,
        //         "quotationId": quotationId,
        //         "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
        //         "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
        //         "referenceCustomer": `${referenceCustomer?.firstName} ${referenceCustomer?.lastName}`,
        //     }
        //     for (let index = 0; index < proofPaymentQuotations?.length; index++) {
        //         const {proofPaymentType, advanceCustomer, conversionAdvance, paymentType, exchangeRateAmount, paymentDate} = proofPaymentQuotations[index];
        //         const letterNumber = this.letterNumberService.convertNumberToWords(advanceCustomer)
        //         const propertiesAdvance: any = {
        //             ...propertiesGeneral,
        //             advanceCustomer,
        //             conversionAdvance,
        //             proofPaymentType,
        //             paymentType,
        //             exchangeRateAmount,
        //             paymentDate: dayjs(paymentDate).format('DD/MM/YYYY'),
        //             letterNumber,
        //             consecutiveId: (index + 1)
        //         }

        //         const nameFile = `recibo_anticipo_${proofPaymentType}_${quotationId}_${dayjs().format()}.pdf`
        //         await this.pdfService.createPDFWithTemplateHtmlSaveFile(`${process.cwd()}/src/templates/recibo_anticipo.html`, propertiesAdvance, {format: 'A3'}, `${process.cwd()}/.sandbox/${nameFile}`);
        //         await this.projectRepository.advanceFile(projectId).create({fileURL: `${process.env.URL_BACKEND}/files/${nameFile}`, name: nameFile, extension: 'pdf'}, {transaction})

        //     }

        // } catch (error) {
        //     await transaction.rollback()
        //     console.log('error: ', error)
        // }
    }

    separeteDecimal(amountPaid: number) {
        const decimalAarray = amountPaid.toString().split('.');
        const decimalString = decimalAarray[1] ? decimalAarray[1].toString() : '00';
        return decimalString
    }

    getPricesQuotation(quotation: Quotation) {
        const {exchangeRateQuotation, } = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const {subtotalEUR, percentageAdditionalDiscount, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, exchangeRate, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR, exchangeRateAmountEUR} = quotation
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
                exchangeRateAmount: exchangeRateAmountEUR,
                advanceCustomer: advanceCustomerEUR,
                conversionAdvance: conversionAdvanceEUR,
                balance: balanceEUR,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscount, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, exchangeRate, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD, exchangeRateAmountUSD} = quotation
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
                exchangeRateAmount: exchangeRateAmountUSD,
                advanceCustomer: advanceCustomerUSD,
                conversionAdvance: conversionAdvanceUSD,
                balance: balanceUSD,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscount, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, exchangeRate, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN, exchangeRateAmountMXN} = quotation
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
                exchangeRateAmount: exchangeRateAmountMXN,
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
            exchangeRateAmount: null,
            advanceCustomer: null,
            conversionAdvance: null,
            balance: null,
        }
        return body;
    }

    async createProject(body: {quotationId: number, branchId: number, customerId?: number}, showroomManager: string, transaction: any) {
        const previousProject = await this.projectRepository.findOne({order: ['createdAt DESC'], include: [{relation: 'branch'}]})
        const branch = await this.branchRepository.findOne({where: {id: body.branchId}})
        let projectId = null;
        let reference = null;
        if (previousProject) {
            projectId = `${previousProject.id + 1}${branch?.name?.charAt(0).toUpperCase()}`;
            reference = `${this.getNumberReference(showroomManager, previousProject.reference)}`;
        } else {
            projectId = `${1}${branch?.name?.charAt(0).toUpperCase()}`;
            reference = `${this.getNumberReference(showroomManager)}`;
        }


        const project = await this.projectRepository.create({...body, projectId, reference}, {transaction});
        return project;
    }

    getNumberReference(nameShowroom: string, reference?: string) {
        return reference ? `${Number(reference.match(/\d+/g)!.join('')) + 1}${nameShowroom.charAt(0).toUpperCase()}` : `1${nameShowroom.charAt(0).toUpperCase()}`;
    }

    async changeStatusProductsToPedido(quotationId: number, transaction: any) {
        await this.quotationProductsRepository.updateAll({status: QuotationProductStatusE.PEDIDO}, {quotationId}, {transaction})
    }

    async updateSKUProducts(quotationId: number, reference: string, transaction: any) {
        const quotationProducts = await this.quotationProductsRepository.find({where: {quotationId}, include: [{relation: 'product', scope: {fields: ['id', 'classificationId']}}]});
        const folioInitial = '001';
        for (let index = 0; index < quotationProducts.length; index++) {
            const {product, id, assembledProducts} = quotationProducts[index];
            const {classificationId} = product;
            const SKU = `${reference}-${classificationId}${this.incrementarFolio(folioInitial)}`;
            if (assembledProducts) {
                const folioInitialAssembled = '01';
                for (let index = 0; index < assembledProducts.length; index++) {
                    const element = assembledProducts[index];
                    const SKUAssembled = `${SKU}.${this.incrementarFolio(folioInitialAssembled)}`;
                    element.SKU = SKUAssembled;
                }
            }
            await this.quotationProductsRepository.updateById(id, {SKU, assembledProducts}, {transaction})
        }
    }

    incrementarFolio(folioActual: string): string {
        let numero = parseInt(folioActual, 10);
        numero++;
        let nuevoFolio = numero.toString().padStart(folioActual.length, '0');
        return nuevoFolio;
    }

    roundToTwoDecimals(num: number): number {
        return Number(new BigNumber(num).toFixed(2));
    }

    async createCommissionPaymentRecord(quotation: Quotation, projectId: number, quotationId: number, transaction: any) {
        const {isArchitect, exchangeRateQuotation, isReferencedCustomer, isProjectManager, isDesigner, showroomManagerId} = quotation;
        //ProjectManager principal
        if (isArchitect === true) {
            const {mainProjectManagerId, classificationPercentageMainpms} = quotation;

            for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                const element = classificationPercentageMainpms[index];
                const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage)
                const body = {
                    userId: mainProjectManagerId,
                    projectId,
                    commissionPercentage: element.commissionPercentage,
                    commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                    projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                    type: AdvancePaymentTypeE.ARQUITECTO,
                    balance: commissionAmount
                }
                await this.commissionPaymentRecordRepository.create(body, {transaction});

            }
        }


        //Arquitecto
        if (isArchitect === true) {
            const {architectName, commissionPercentageArchitect} = quotation;
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentageArchitect)
            const body = {
                userName: architectName,
                projectId,
                commissionPercentage: commissionPercentageArchitect,
                commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                type: AdvancePaymentTypeE.ARQUITECTO,
                balance: commissionAmount
            }
            await this.commissionPaymentRecordRepository.create(body, {transaction});
        }

        //Cliente referenciado
        if (isReferencedCustomer === true) {
            const {referenceCustomerId, commissionPercentagereferencedCustomer} = quotation;
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentagereferencedCustomer);
            const body = {
                userId: referenceCustomerId,
                projectId,
                commissionPercentage: commissionPercentagereferencedCustomer,
                commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                type: AdvancePaymentTypeE.CLIENTE_REFERENCIADO,
                balance: commissionAmount
            }
            await this.commissionPaymentRecordRepository.create(body, {transaction});
        }

        //Project managers
        if (isProjectManager === true) {
            const quotationProjectManagers = await this.quotationProjectManagerRepository.find({where: {quotationId}, include: ['classificationPercentageMainpms']});
            for (const iterator of quotationProjectManagers) {
                const {classificationPercentageMainpms, userId} = iterator;
                for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                    const element = classificationPercentageMainpms[index];
                    const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage);
                    const body = {
                        userId: userId,
                        projectId,
                        commissionPercentage: element.commissionPercentage,
                        commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                        projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                        type: AdvancePaymentTypeE.PROJECT_MANAGER,
                        balance: commissionAmount
                    }
                    await this.commissionPaymentRecordRepository.create(body, {transaction});
                }

            }
        }

        //Showroom manager
        if (showroomManagerId) {
            const commissionPercentage = 16;
            const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, commissionPercentage);
            const body = {
                userId: showroomManagerId,
                projectId,
                commissionPercentage: commissionPercentage,
                commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                type: AdvancePaymentTypeE.SHOWROOM_MANAGER,
                balance: commissionAmount
            }
            await this.commissionPaymentRecordRepository.create(body, {transaction});
        }

        //Proyectistas
        if (isDesigner === true) {
            const QuotationDesigners = await this.quotationDesignerRepository.find({where: {quotationId}, include: ['classificationPercentageMainpms']});
            for (const iterator of QuotationDesigners) {
                const {classificationPercentageMainpms, userId} = iterator;
                for (let index = 0; index < classificationPercentageMainpms?.length; index++) {
                    const element = classificationPercentageMainpms[index];
                    const commissionAmount = this.calculateCommissionAmount(exchangeRateQuotation, quotation, element.commissionPercentage);
                    const body = {
                        userId: userId,
                        projectId,
                        commissionPercentage: element.commissionPercentage,
                        commissionAmount: this.roundToTwoDecimals(commissionAmount ?? 0),
                        projectTotal: this.getTotalQuotation(exchangeRateQuotation, quotation),
                        type: AdvancePaymentTypeE.PROYECTISTA,
                        balance: commissionAmount
                    }
                    await this.commissionPaymentRecordRepository.create(body, {transaction});

                }
            }
        }

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

    async createAdvancePaymentRecord(quotation: Quotation, projectId: number, reference: string, transaction: any) {
        const {proofPaymentQuotations, exchangeRateQuotation, percentageIva, customerId, id, createdAt, isFractionate, typeFractional} = quotation;
        if (isFractionate) {
            if (typeFractional.EUR == true) {
                const {totalEUR, ivaEUR} = quotation;
                const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalEUR ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalEUR ?? 0, typeCurrency: ExchangeRateQuotationE.EUR}, {transaction});
                for (let index = 0; index < proofPaymentQuotations?.length; index++) {
                    const {paymentDate, paymentType, exchangeRateAmount, exchangeRate, id, documents, conversionAdvance, proofPaymentType, advanceCustomer} = proofPaymentQuotations[index];
                    if (proofPaymentType === ExchangeRateQuotationE.EUR) {
                        const conversionAmountPaid = this.bigNumberDividedBy(conversionAdvance || advanceCustomer, exchangeRateAmount || 1); //importe pagado
                        const subtotalAmountPaid = this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1)) //importe pagado sin iva
                        const paymentPercentage = this.calculatePercentage(conversionAmountPaid, totalEUR)
                        await this.createAdvancePaymentRecordRepository(`${reference}-${ExchangeRateQuotationE.EUR}`, paymentType, advanceCustomer, exchangeRate, exchangeRateAmount, percentageIva, exchangeRateQuotation, this.roundToTwoDecimals(conversionAmountPaid), this.roundToTwoDecimals(subtotalAmountPaid), this.roundToTwoDecimals(paymentPercentage), projectId, accountsReceivable.id, transaction, documents, paymentDate);
                    }
                }
            }

            if (typeFractional.MXN == true) {
                const {totalMXN, ivaMXN} = quotation;
                const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalMXN ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalMXN ?? 0, typeCurrency: ExchangeRateQuotationE.MXN}, {transaction});
                for (let index = 0; index < proofPaymentQuotations?.length; index++) {
                    const {paymentDate, paymentType, exchangeRateAmount, exchangeRate, id, documents, conversionAdvance, proofPaymentType, advanceCustomer} = proofPaymentQuotations[index];
                    if (proofPaymentType === ExchangeRateQuotationE.MXN) {
                        const conversionAmountPaid = this.bigNumberDividedBy(conversionAdvance || advanceCustomer, exchangeRateAmount || 1); //importe pagado
                        const subtotalAmountPaid = this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1)) //importe pagado sin iva
                        const paymentPercentage = this.calculatePercentage(conversionAmountPaid, totalMXN)
                        await this.createAdvancePaymentRecordRepository(`${reference}-${ExchangeRateQuotationE.MXN}`, paymentType, advanceCustomer, exchangeRate, exchangeRateAmount, percentageIva, exchangeRateQuotation, this.roundToTwoDecimals(conversionAmountPaid), this.roundToTwoDecimals(subtotalAmountPaid), this.roundToTwoDecimals(paymentPercentage), projectId, accountsReceivable.id, transaction, documents, paymentDate);
                    }

                }
            }

            if (typeFractional.USD == true) {
                const {totalUSD, ivaUSD} = quotation;
                const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: totalUSD ?? 0, totalPaid: 0, updatedTotal: 0, balance: totalUSD ?? 0, typeCurrency: ExchangeRateQuotationE.USD}, {transaction});
                for (let index = 0; index < proofPaymentQuotations?.length; index++) {
                    const {paymentDate, paymentType, exchangeRateAmount, exchangeRate, id, documents, conversionAdvance, proofPaymentType, advanceCustomer} = proofPaymentQuotations[index];
                    if (proofPaymentType === ExchangeRateQuotationE.USD) {
                        const conversionAmountPaid = this.bigNumberDividedBy(conversionAdvance || advanceCustomer, exchangeRateAmount || 1); //importe pagado
                        const subtotalAmountPaid = this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1)) //importe pagado sin iva
                        const paymentPercentage = this.calculatePercentage(conversionAmountPaid, totalUSD)
                        await this.createAdvancePaymentRecordRepository(`${reference}-${ExchangeRateQuotationE.USD}`, paymentType, advanceCustomer, exchangeRate, exchangeRateAmount, percentageIva, exchangeRateQuotation, this.roundToTwoDecimals(conversionAmountPaid), this.roundToTwoDecimals(subtotalAmountPaid), this.roundToTwoDecimals(paymentPercentage), projectId, accountsReceivable.id, transaction, documents, paymentDate);
                    }

                }
            }
        } else {
            const {total, iva, exchangeRate} = this.getPricesQuotation(quotation);
            const accountsReceivable = await this.accountsReceivableRepository.create({quotationId: id, projectId, customerId, totalSale: total ?? 0, totalPaid: 0, updatedTotal: 0, balance: total ?? 0, typeCurrency: exchangeRateQuotation}, {transaction});
            for (let index = 0; index < proofPaymentQuotations?.length; index++) {
                const {paymentDate, paymentType, exchangeRateAmount, exchangeRate, id, documents, conversionAdvance, proofPaymentType, advanceCustomer} = proofPaymentQuotations[index];
                // const conversionAmountPaid = this.bigNumberDividedBy(conversionAdvance, exchangeRateAmount);
                // const subtotalAmountPaid = this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1))
                // const paymentPercentage = this.calculatePercentage(conversionAmountPaid, total ?? 0)
                // await this.createAdvancePaymentRecordRepository(accountsReceivable.id, projectId, paymentPercentage, subtotalAmountPaid, iva ?? 0, conversionAmountPaid, proofPaymentType, percentageIva, exchangeRateAmount, exchangeRate, conversionAdvance, paymentType, transaction, documents, paymentDate);
                console.log('conversionAdvance: ', conversionAdvance)
                console.log('exchangeRateAmount: ', exchangeRateAmount)
                console.log('percentageIva: ', percentageIva)
                console.log('total: ', total)
                const conversionAmountPaid = this.bigNumberDividedBy(conversionAdvance || advanceCustomer, exchangeRateAmount || 1); //importe pagado
                const subtotalAmountPaid = this.bigNumberDividedBy(conversionAmountPaid, ((percentageIva / 100) + 1)) //importe pagado sin iva
                const paymentPercentage = this.calculatePercentage(conversionAmountPaid, total ?? 0)
                console.log('conversionAmountPaid: ', conversionAmountPaid)
                console.log('subtotalAmountPaid: ', subtotalAmountPaid)
                console.log('paymentPercentage: ', paymentPercentage)

                await this.createAdvancePaymentRecordRepository(`${reference}-${ExchangeRateQuotationE.EUR}`, paymentType, advanceCustomer, exchangeRate, exchangeRateAmount, percentageIva, exchangeRateQuotation, this.roundToTwoDecimals(conversionAmountPaid), this.roundToTwoDecimals(subtotalAmountPaid), this.roundToTwoDecimals(paymentPercentage), projectId, accountsReceivable.id, transaction, documents, paymentDate);

            }

        }
    }

    async createAdvancePaymentRecordRepository(reference: string, paymentMethod: PaymentTypeProofE, amountPaid: number, paymentCurrency: ExchangeRateE, parity: number, percentageIva: number, currencyApply: ExchangeRateQuotationE, conversionAmountPaid: number, subtotalAmountPaid: number, paymentPercentage: number, projectId: number, accountsReceivableId: number, transaction: any, documents: any, paymentDate: Date | undefined) {
        const body = {
            consecutiveId: 1,
            paymentDate,
            paymentMethod,
            amountPaid,
            paymentCurrency,
            parity,
            percentageIva,
            currencyApply,
            conversionAmountPaid,
            // salesDeviation: ((conversionAmountPaid / (1 + (iva ?? 0))) - subtotalAmountPaid),
            salesDeviation: 0,
            subtotalAmountPaid,
            paymentPercentage,
            projectId,
            type: TypeAdvancePaymentRecordE.ANTICIPO_PRODUCTO,
            accountsReceivableId,
            reference
        }
        console.log('body: ', body)
        const advancePaymentRecord = await this.advancePaymentRecordRepository.create(body, {transaction});
        for (let index = 0; index < documents.length; index++) {
            const {fileURL, name, extension} = documents[index];
            await this.advancePaymentRecordRepository.documents(advancePaymentRecord.id).create({fileURL, name, extension})
        }
    }

    bigNumberDividedBy(price: number, value: number): number {
        return Number(new BigNumber(price).dividedBy(new BigNumber(value)));
    }

    bigNumberMultipliedBy(price: number, value: number): number {
        return Number(new BigNumber(price).multipliedBy(new BigNumber(value)));
    }


    calculatePercentage(conversionAmountPaid: number, total: number) {
        return (conversionAmountPaid / total) * 100
    }

    async findQuotationById(id: number) {
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

    async getAccountStatement(id: number) {
        const project = await this.findProjectById(id);
        const advancePaymentRecordsFind = await this.accountsReceivableRepository.find({where: {projectId: id}, include: ['advancePaymentRecords']});
        const {projectId, customer, quotation} = project;
        const {showroomManager, mainProjectManager, closingDate} = quotation;
        let data = [];
        for (let index = 0; index < advancePaymentRecordsFind.length; index++) {
            const element = advancePaymentRecordsFind[index];
            const {totalSale, updatedTotal, totalPaid, balance, advancePaymentRecords, typeCurrency} = element;
            try {
                let balanceDetail = totalSale;
                data.push({
                    typeCurrency,
                    today: dayjs().format('DD/MM/YYYY'),
                    projectId,
                    customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                    projectManager: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                    showroomManager: `${showroomManager?.firstName} ${showroomManager?.lastName ?? ''}`,
                    closingDate: dayjs(closingDate).format('DD/MM/YYYY'),
                    totalSale,
                    updatedTotal,
                    totalPaid,
                    totalPercentage: 0,
                    balance,
                    advancePaymentRecords: advancePaymentRecords.map(value => {
                        balanceDetail = balanceDetail - value.subtotalAmountPaid;
                        return {
                            ...value,
                            balanceDetail: balanceDetail.toFixed(2),
                            paymentDate: dayjs(value.paymentDate).format('DD/MM/YYYY'),
                            amountPaid: value.subtotalAmountPaid.toFixed(2),
                            subtotalAmountPaid: value.subtotalAmountPaid.toFixed(2),
                            conversionAmountPaid: value.subtotalAmountPaid.toFixed(2),
                        }
                    })
                })

            } catch (error) {
            }
        }
        const properties: any = {
            data
        }
        const nameFile = `estado_de_cuenta_${dayjs().format()}.pdf`
        const buffer = await this.pdfService.createPDFWithTemplateHtmlToBuffer(`${process.cwd()}/src/templates/estado_cuenta.html`, properties, {format: 'A3'});
        this.response.setHeader('Content-Disposition', `attachment; filename=${nameFile}`);
        this.response.setHeader('Content-Type', 'application/pdf');
        return this.response.status(200).send(buffer)

    }

    async findAccountReceivable(id: number) {
        const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {id}, include: ['advancePaymentRecords']});
        if (!accountsReceivable)
            throw this.responseService.badRequest('La cuenta por cobrar no existe.');
        return accountsReceivable
    }

    async findProjectById(id: number) {
        const project = await this.projectRepository.findById(id, {
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'showroomManagerId', 'closingDate', 'totalEUR', 'totalMXN', 'totalUSD', 'mainProjectManagerId'],
                        include: [
                            {
                                relation: 'showroomManager',
                                scope: {
                                    fields: ['id', 'firstName', 'lastName']
                                }
                            },
                            {
                                relation: 'mainProjectManager',
                                scope: {
                                    fields: ['id', 'firstName', 'lastName']
                                }
                            }
                        ]
                    }
                },
                {
                    relation: 'customer',
                    scope: {
                        fields: ['name', 'lastName', 'secondLastName']
                    }
                }
            ]
        });
        return project;
    }

}
