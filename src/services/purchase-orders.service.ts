import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import fs from "fs/promises";
import moment from 'moment';
import {AccessLevelRolE, PurchaseOrdersStatus, QuotationProductStatusE, TypeArticleE, TypeQuotationE} from '../enums';
import {schameUpdateStatusPurchase} from '../joi.validation.ts/purchase-order.validation';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {PurchaseOrders, QuotationProductsWithRelations} from '../models';
import {AccountPayableRepository, CollectionRepository, ContainerRepository, ProformaRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository, QuotationRepository, UserRepository} from '../repositories';
import {PdfService} from './pdf.service';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseOrdersService {
    constructor(
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @service()
        public pdfService: PdfService,
        @inject(RestBindings.Http.RESPONSE)
        private response: Response,
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @repository(CollectionRepository)
        public collectionRepository: CollectionRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
        @repository(AccountPayableRepository)
        public accountPayableRepository: AccountPayableRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService
    ) { }


    async create(purchaseOrders: Omit<PurchaseOrders, 'id'>,) {
        return this.purchaseOrdersRepository.create(purchaseOrders);
    }

    async count(where?: Where<PurchaseOrders>,) {
        return this.purchaseOrdersRepository.count(where);
    }

    async find(filter?: Filter<PurchaseOrders>,) {
        const accessLevel = this.user.accessLevel;
        let where: any = {};
        if (accessLevel === AccessLevelRolE.SUCURSAL) {
            const projects = (await this.projectRepository.find({where: {branchId: this.user.branchId}})).map(value => value.id);
            const proforma = (await this.proformaRepository.find({where: {projectId: {inq: [...projects]}}})).map(value => value.id);
            where = {...where, proformaId: {inq: [...proforma]}}
        }

        if (accessLevel === AccessLevelRolE.PERSONAL) {
            const quotations = (await this.quotationRepository.find({where: {mainProjectManagerId: this.user.id}})).map(value => value.id);
            const projects = (await this.projectRepository.find({where: {quotationId: {inq: [...quotations]}}})).map(value => value.id);
            const proforma = (await this.proformaRepository.find({where: {projectId: {inq: [...projects]}}})).map(value => value.id);
            where = {...where, proformaId: {inq: [...proforma]}}
        }

        if (filter?.where) {
            filter.where = {...filter.where, ...where}
        } else {
            filter = {...filter, where: {...where}};
        }

        const include: InclusionFilter[] = [
            {
                relation: 'proforma',
                scope: {
                    include: [
                        {
                            relation: 'provider',
                            scope: {
                                fields: ['name']
                            }
                        }
                        ,
                        {
                            relation: 'brand',
                            scope: {
                                fields: ['brandName']
                            }
                        },
                        {
                            relation: 'quotationProducts',
                            scope: {
                                fields: ['id', "quantity", "proformaId",]
                            }
                        },
                        {
                            relation: 'project',
                            scope: {
                                fields: ['id', 'quotationId', 'projectId'],
                                include: [
                                    {
                                        relation: 'quotation',
                                        scope: {
                                            fields: ['id', 'closingDate']
                                        }
                                    }
                                ]
                            }
                        }
                    ]
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
        return (await this.purchaseOrdersRepository.find(filter)).map(value => {
            const {id, proforma, status} = value;
            const {provider, brand, quotationProducts, project} = proforma;
            const {quotation, projectId} = project
            return {
                id,
                projectId,
                provider: `${provider.name}`,
                brand: `${brand?.brandName}`,
                quantity: quotationProducts?.length ?? 0,
                status,
                closingDate: quotation?.closingDate
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<PurchaseOrders>) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'accountPayable'
                },
                {
                    relation: 'proforma',
                    scope: {
                        include: [
                            {
                                relation: 'provider',
                                scope: {
                                    fields: ['id', 'name']
                                }
                            }
                            ,
                            {
                                relation: 'brand',
                                scope: {
                                    fields: ['id', 'brandName']
                                }
                            },
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    include: [
                                        {
                                            relation: 'product',
                                            scope: {
                                                fields: ['id', 'lineId', 'document'],
                                                include: [
                                                    {
                                                        relation: 'line',
                                                        scope: {
                                                            fields: ['id', 'name'],
                                                        }
                                                    },
                                                    {
                                                        relation: 'document',
                                                        scope: {
                                                            fields: ['id', 'fileURL'],
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                relation: 'project',
                                scope: {
                                    fields: ['id', 'customerId', 'quotationId', 'projectId'],
                                    include: [
                                        {
                                            relation: 'customer',
                                            scope: {
                                                fields: ['id', 'name', 'lastName', 'secondLastName']
                                            }
                                        },
                                        {
                                            relation: 'quotation',
                                            scope: {
                                                fields: ['id', 'mainProjectManagerId'],
                                                include: [
                                                    {
                                                        relation: 'mainProjectManager',
                                                        scope: {
                                                            fields: ['id', 'firstName', 'lastName']
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
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
            const purchaseOrders = await this.purchaseOrdersRepository.findById(id, filter);
            const {createdAt, proforma, status, accountPayableId, proformaId, productionEndDate, productionRealEndDate, accountPayable} = purchaseOrders;
            const {provider, brand, quotationProducts, project} = proforma;
            const {customer, quotation, projectId} = project
            const {mainProjectManager} = quotation
            const percentagePaid = this.calculatePercentagePaid(accountPayable.total, accountPayable.totalPaid);

            return {
                id,
                projectId: projectId,
                productionEndDate: productionEndDate ?? null,
                productionRealEndDate: productionRealEndDate ?? null,
                createdAt,
                provider,
                brand,
                customer: customer ? `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}` : 'Showroom',
                mainPM: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                accountPayableId,
                percentagePaid: this.roundToTwoDecimals(percentagePaid),
                status,
                proformaId,
                date: 'Aun estamos trabajando en calcular la fecha.',
                quotationProducts: quotationProducts.map((value: QuotationProductsWithRelations) => {
                    const {SKU, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, originCode, model, quantity, measureWide, measureHigh, measureDepth, measureCircumference} = value;
                    const {line, name, document} = product;
                    const descriptionParts = [
                        line?.name,
                        name,
                        mainMaterial,
                        mainFinish,
                        secondaryMaterial,
                        secondaryFinishing
                    ];

                    const description = descriptionParts
                        .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                        .join(' ');  // Únelas con un espacio
                    const measuresParts = [
                        measureWide ? `Ancho: ${measureWide}` : "",
                        measureHigh ? `Alto: ${measureHigh}` : "",
                        measureDepth ? `Prof: ${measureDepth}` : "",
                        measureCircumference ? `Circ: ${measureCircumference}` : ""
                    ];
                    const measures = measuresParts
                        .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                        .join(' ');  // Únelas con un espacio
                    return {
                        SKU,
                        image: document?.fileURL,
                        model,
                        description,
                        measures,
                        originCode,
                        quantity
                    }
                })
            };
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    calculatePercentagePaid(total: number, totalPaid: number) {
        return (totalPaid / total) * 100;
    }

    roundToTwoDecimals(num: number): number {
        return Number(new BigNumber(num).toFixed(2));
    }

    async downloadPurchaseOrder(purchaseOrderId: number) {
        const purchaseOrde = await this.purchaseOrdersRepository.findOne({where: {id: purchaseOrderId}})
        if (!purchaseOrde)
            throw this.responseService.notFound("La orden de compra no se ha encontrado.")

        const proforma = await this.proformaRepository.findOne({
            where: {id: purchaseOrde?.proformaId}, include: [
                {
                    relation: 'quotationProducts',
                    scope:
                    {
                        include: [
                            {
                                relation: 'product',
                                scope: {
                                    include: [{relation: "brand"}, {relation: "document"}]
                                }
                            },
                            {
                                relation: 'mainFinishImage',
                            }
                        ]
                    }
                },
                {
                    relation: 'project',
                }
            ]
        })
        if (!proforma)
            throw this.responseService.notFound("La proforma no se ha encontrado.")

        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`
        const {quotationProducts, project} = proforma

        //aqui
        let prodcutsArray = [];
        for (const quotationProduct of quotationProducts) {
            const {product, assembledProducts} = quotationProduct;
            const {brand, document, quotationProducts, typeArticle, line, name} = product;
            const descriptionParts = [
                line?.name,
                name,
                quotationProduct?.mainMaterial,
                quotationProduct?.mainFinish,
                quotationProduct?.secondaryMaterial,
                quotationProduct?.secondaryFinishing
            ];
            const measuresParts = [
                quotationProduct?.measureWide ? `Ancho: ${quotationProduct?.measureWide}` : "",
                quotationProduct?.measureHigh ? `Alto: ${quotationProduct?.measureHigh}` : "",
                quotationProduct?.measureDepth ? `Prof: ${quotationProduct?.measureDepth}` : "",
                quotationProduct?.measureCircumference ? `Circ: ${quotationProduct?.measureCircumference}` : ""
            ];

            const description = descriptionParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            const measures = measuresParts
                .filter(part => part !== null && part !== undefined && part !== '')  // Filtra partes que no son nulas, indefinidas o vacías
                .join(' ');  // Únelas con un espacio
            prodcutsArray.push({
                brandName: brand?.brandName,
                status: quotationProduct?.status,
                description,
                measures,
                image: document?.fileURL ?? defaultImage,
                mainFinish: quotationProduct?.mainFinish,
                mainFinishImage: quotationProduct?.mainFinishImage?.fileURL ?? defaultImage,
                quantity: quotationProduct?.quantity,
                typeArticle: TypeArticleE.PRODUCTO_ENSAMBLADO === typeArticle ? true : false,
                originCode: quotationProduct?.originCode,
                assembledProducts: assembledProducts ?? [],
            })
        }
        const logo = `data:image/png;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/logo_benetti.png`, {encoding: 'base64'})}`

        const {quotationId} = project

        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}, {relation: 'assembledProducts', scope: {include: ['document']}}]}}]});
        const {customer, mainProjectManager, referenceCustomer, } = quotation;
        const reference = `${project?.reference ?? ""}`
        try {
            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": reference,
                "products": prodcutsArray,
                "type": 'PEDIDO',
                isTypeQuotationGeneral: quotation.typeQuotation === TypeQuotationE.GENERAL
            }
            const buffer = await this.pdfService.createPDFWithTemplateHtmlToBuffer(`${process.cwd()}/src/templates/cotizacion_proveedor.html`, properties, {format: 'A3'});
            this.response.setHeader('Content-Disposition', `attachment; filename=order_compra.pdf`);
            this.response.setHeader('Content-Type', 'application/pdf');
            return this.response.status(200).send(buffer)
        } catch (error) {
            console.log('error: ', error)
        }
    }

    async updateById(id: number, purchaseOrders: PurchaseOrders,) {
        await this.purchaseOrdersRepository.updateById(id, purchaseOrders);
    }

    async updateStatusById(id: number, data: {status: PurchaseOrdersStatus},) {
        await this.findPurchaseOrderById(id);
        await this.validateBodyStatusPurchase(data);
        const {status} = data;
        await this.purchaseOrdersRepository.updateById(id, {status});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async validateBodyStatusPurchase(data: {status: PurchaseOrdersStatus},) {
        try {
            await schameUpdateStatusPurchase.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

            throw this.responseService.unprocessableEntity(message)
        }
    }

    async findPurchaseOrderById(id: number) {
        const purchaseOrder = await this.purchaseOrdersRepository.findOne({where: {id}})
        if (!purchaseOrder)
            throw this.responseService.notFound("La orden de compra no se ha encontrado.")
        return purchaseOrder
    }


    async deleteById(id: number) {
        await this.purchaseOrdersRepository.deleteById(id);
    }

    async saveProductionRealEndDate(id: number, data: {productionRealEndDate: string},) {
        const {collectionId} = await this.findPurchaseOrderById(id);
        await this.purchaseOrdersRepository.updateById(id, {productionRealEndDate: data.productionRealEndDate})
        await this.calculateArrivalDatePurchaseOrder(id, collectionId);
        await this.updateToCollectionStatus(id);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async updateToCollectionStatus(purchaseOrderId: number) {
        const purchaseOrder = await this.purchaseOrdersRepository.findById(purchaseOrderId, {
            include: [
                {
                    relation: 'accountPayable'
                },
                {
                    relation: 'proforma',
                    scope: {
                        fields: ['id', 'quotationProducts'],
                        include: [
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    fields: ['id', 'proformaId']
                                }
                            }
                        ]
                    }
                }
            ]
        })

        const currentDate = moment();
        let endDate = purchaseOrder?.productionEndDate;

        if (purchaseOrder?.productionRealEndDate)
            endDate = purchaseOrder.productionRealEndDate;

        const isAfterEndDate = moment(endDate).isSameOrBefore(currentDate);

        if (purchaseOrder?.accountPayable?.totalPaid >= purchaseOrder?.accountPayable?.total && isAfterEndDate) {

            await this.purchaseOrdersRepository.updateById(purchaseOrderId, {status: PurchaseOrdersStatus.EN_RECOLECCION, isPaid: true})
            await this.accountPayableRepository.updateById(purchaseOrder?.accountPayable?.id, {isPaid: true})
            const {proforma} = purchaseOrder
            const {quotationProducts} = proforma;
            for (let index = 0; index < quotationProducts.length; index++) {
                const element = quotationProducts[index];
                await this.quotationProductsRepository.updateById(element.id, {status: QuotationProductStatusE.RECOLECCION})
            }
            await this.notifyLogistics(purchaseOrder.id);
        }

        return false;
    }

    async notifyLogistics(purchaseOrderId?: number) {
        const users = await this.userRepository.find({where: {isLogistics: true}})
        const emails = users.map(value => value.email);
        for (let index = 0; index < emails?.length; index++) {
            const elementMail = emails[index];
            const options = {
                to: elementMail,
                templateId: SendgridTemplates.NOTIFICATION_LOGISTIC.id,
                dynamicTemplateData: {
                    subject: SendgridTemplates.NOTIFICATION_LOGISTIC.subject,
                    purchaseOrderId
                }
            };
            await this.sendgridService.sendNotification(options);
        }
    }

    async calculateArrivalDatePurchaseOrder(id: number, collectionId?: number) {
        console.log("collectionId:", collectionId)
        if (collectionId) {
            const collectionFind = await this.collectionRepository.findById(collectionId);
            const include: InclusionFilter[] = [
                {
                    relation: 'purchaseOrders',
                },
                {
                    relation: 'collection',
                    scope: {
                        include: [
                            {
                                relation: 'purchaseOrders'
                            }
                        ]
                    }
                }
            ]
            const container = await this.containerRepository.findOne({where: {id: collectionFind.containerId}, include});
            if (container) {
                const {ETDDate, ETADate} = container;
                let arrivalDate;
                if (ETADate) {
                    arrivalDate = dayjs(ETADate).add(10, 'days').toDate()
                    await this.containerRepository.updateById(collectionFind.containerId, {arrivalDateWarehouse: arrivalDate})
                }
                else if (ETDDate) {
                    arrivalDate = dayjs(ETDDate).add(31, 'days').toDate()
                    await this.containerRepository.updateById(collectionFind.containerId, {arrivalDateWarehouse: arrivalDate})
                }
                const purchaseOrdersFor = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
                for (let index = 0; index < purchaseOrdersFor.length; index++) {
                    const element = purchaseOrdersFor[index];
                    if (arrivalDate) {
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        continue;
                    }
                    const {productionEndDate, productionRealEndDate} = element;
                    if (productionRealEndDate) {
                        const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        continue;
                    }
                    if (productionEndDate) {
                        const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        continue;
                    }
                }
            } else {
                const include: InclusionFilter[] = [
                    {
                        relation: 'purchaseOrders',
                    },

                ]
                const collectionFind = await this.collectionRepository.findById(collectionId, {include});
                const purchaseOrdersFor = [...collectionFind?.purchaseOrders ?? []];
                for (let index = 0; index < purchaseOrdersFor.length; index++) {
                    const element = purchaseOrdersFor[index];
                    const {productionEndDate, productionRealEndDate} = element;
                    if (productionRealEndDate) {
                        const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        continue;
                    }
                    if (productionEndDate) {
                        const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        continue;
                    }
                }
            }
        } else {
            const {productionEndDate, productionRealEndDate} = await this.findPurchaseOrderById(id);
            if (productionRealEndDate) {
                const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                await this.purchaseOrdersRepository.updateById(id, {arrivalDate})
            }
            if (productionEndDate) {
                const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                await this.purchaseOrdersRepository.updateById(id, {arrivalDate})
            }
        }
    }

    async earringsCollect() {
        const include: InclusionFilter[] = [
            {
                relation: 'proforma',
                scope: {
                    include: [
                        {
                            relation: 'quotationProducts',
                        },
                        {
                            relation: 'provider'
                        },
                        {
                            relation: 'brand'
                        }
                    ]
                }
            },
            {
                relation: "project"
            }
        ]
        const and: any = [
            {
                status: PurchaseOrdersStatus.EN_RECOLECCION
            },
            // {
            //     collectionId: {eq: null}
            // }
        ]

        const purchaseOrders = await this.purchaseOrdersRepository.find({
            where: {
                and: [
                    ...and
                ]
            }, include: [...include]
        })
        return purchaseOrders.map(value => {
            const {id: purchaseOrderid, projectId, proforma, productionEndDate, productionRealEndDate, productionStartDate} = value;
            const {proformaId, provider, brand, quotationProducts} = proforma;
            const {name} = provider;
            const {brandName} = brand;
            return {
                id: purchaseOrderid,
                proformaId,
                provider: name,
                brand: brandName,
                quantity: quotationProducts?.length ?? 0,
                productionEndDate: productionEndDate ?? null,
                productionRealEndDate: productionRealEndDate ?? null,
                productionStartDate: productionStartDate ?? null,
                projectId: value?.project?.projectId,
                project: value?.project
            }
        })
    }

    async getPurchaseOrderToUpdate() {
        const currentDate = moment();
        const endDay = currentDate.endOf('day').toDate();

        const purchaseOrdersRealEndDate = await this.purchaseOrdersRepository.find({
            where: {
                productionRealEndDate: {
                    lte: endDay,
                },
                status: PurchaseOrdersStatus.EN_PRODUCCION
            },
            include: [
                {
                    relation: "accountPayable",
                }
            ]
        });

        const purchaseOrdersEndDate = await this.purchaseOrdersRepository.find({
            where: {
                productionEndDate: {
                    lte: endDay,
                },
                productionRealEndDate: undefined,
                status: PurchaseOrdersStatus.EN_PRODUCCION
            },
            include: [
                {
                    relation: "accountPayable",
                }
            ]
        });

        const purchaseOrders = purchaseOrdersRealEndDate.concat(purchaseOrdersEndDate)

        let purchaseOrderUpdatedCount = 0;

        for (const purchaseOrder of purchaseOrders) {
            const {accountPayable} = purchaseOrder;

            if (accountPayable.totalPaid >= accountPayable.total) {
                await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {
                    status: PurchaseOrdersStatus.EN_RECOLECCION
                })
                purchaseOrderUpdatedCount++
            }

        }

        console.log("purchaseOrderUpdatedCount: ", purchaseOrderUpdatedCount)
    }

}
