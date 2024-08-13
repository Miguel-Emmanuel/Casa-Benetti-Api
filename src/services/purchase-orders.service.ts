import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import dayjs from 'dayjs';
import fs from "fs/promises";
import {AccessLevelRolE, PurchaseOrdersStatus, TypeArticleE} from '../enums';
import {schameUpdateStatusPurchase} from '../joi.validation.ts/purchase-order.validation';
import {ResponseServiceBindings} from '../keys';
import {PurchaseOrders, QuotationProductsWithRelations} from '../models';
import {CollectionRepository, ContainerRepository, ProformaRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository, QuotationRepository} from '../repositories';
import {PdfService} from './pdf.service';
import {ResponseService} from './response.service';

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
                                fields: ['id', 'quotationId'],
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
            const {provider, brand, quotationProducts, projectId, project} = proforma;
            const {quotation} = project
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
                                    fields: ['id', 'customerId', 'quotationId'],
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
            const {createdAt, proforma, status, accountPayableId, proformaId, productionEndDate, productionRealEndDate} = purchaseOrders;
            const {provider, brand, quotationProducts, project} = proforma;
            const {customer, quotation} = project
            const {mainProjectManager} = quotation

            return {
                id,
                projectId: project?.id,
                productionEndDate: productionEndDate ?? null,
                productionRealEndDate: productionRealEndDate ?? null,
                createdAt,
                provider,
                brand,
                customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                mainPM: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                accountPayableId,
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
        console.log("quotationProduct", quotationProducts);

        for (const quotationProduct of quotationProducts) {
            const {product} = quotationProduct;
            const {brand, document, quotationProducts, typeArticle, assembledProducts, line, name} = product;
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
                assembledProducts: assembledProducts
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
                "type": 'PEDIDO'
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
        await this.calculateArrivalDatePurchaseOrder(collectionId);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async calculateArrivalDatePurchaseOrder(collectionId?: number) {
        if (collectionId) {
            const collectionFind = await this.collectionRepository.findById(collectionId);
            const include: InclusionFilter[] = [
                {
                    relation: 'collection',
                    scope: {
                        include: [
                            {
                                relation: 'purchaseOrders',
                            }
                        ]
                    }
                }
            ]
            const container = await this.containerRepository.findById(collectionFind.containerId, {include});
            const {ETDDate, ETADate} = container;
            let arrivalDate;
            if (ETADate) {
                arrivalDate = dayjs(ETADate).add(10, 'days')
            }
            else if (ETDDate) {
                arrivalDate = dayjs(ETDDate).add(31, 'days')
            }
            const {collection} = container;
            const {purchaseOrders} = collection;
            if (purchaseOrders) {
                for (let index = 0; index < purchaseOrders.length; index++) {
                    const element = purchaseOrders[index];
                    if (arrivalDate) {
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        return;
                    }
                    const {productionEndDate, productionRealEndDate} = element;
                    if (productionRealEndDate) {
                        const arrivalDate = dayjs(productionRealEndDate).add(53, 'days')
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        return;
                    }
                    if (productionEndDate) {
                        const arrivalDate = dayjs(productionEndDate).add(53, 'days')
                        await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                        return;
                    }
                }
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
            }
        ]
        const and: any = [
            {
                status: PurchaseOrdersStatus.EN_RECOLECCION
            },
            {
                collectionId: {eq: null}
            }
        ]
        const purchaseOrders = await this.purchaseOrdersRepository.find({
            where: {
                and: [
                    ...and
                ]
            }, include: [...include]
        })

        return purchaseOrders.map(value => {
            const {id: purchaseOrderid, proforma, productionEndDate} = value;
            const {proformaId, provider, brand, quotationProducts} = proforma;
            const {name} = provider;
            const {brandName} = brand;
            return {
                id: purchaseOrderid,
                proformaId,
                provider: name,
                brand: brandName,
                quantity: quotationProducts?.length ?? 0,
                productionEndDate
            }
        })
    }
}
