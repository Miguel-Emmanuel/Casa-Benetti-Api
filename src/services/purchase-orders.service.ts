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
import {ProformaRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository, QuotationRepository} from '../repositories';
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
                        }]
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
            const {provider, brand, quotationProducts, projectId} = proforma;
            return {
                id,
                projectId,
                provider: `${provider.name}`,
                brand: `${brand?.brandName}`,
                quantity: quotationProducts?.length ?? 0,
                status
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
            const {createdAt, proforma, status, accountPayableId, proformaId} = purchaseOrders;
            const {provider, brand, quotationProducts, project} = proforma;
            const {customer, quotation} = project
            const {mainProjectManager} = quotation
            return {
                id,
                projectId: project?.id,
                productionEndDate: null,
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
                    const {SKU, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, measureWide, originCode, model, quantity} = value;
                    const {line, name, document} = product;
                    return {
                        SKU,
                        image: document?.fileURL,
                        model,
                        description: `${line?.name} ${name} ${mainMaterial ?? ''} ${mainFinish ?? ''} ${secondaryMaterial ?? ''} ${secondaryFinishing ?? ''} ${measureWide ?? ''}`,
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
                                relation: 'product'
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
            const {product} = quotationProduct;
            const {brand, document, quotationProducts, typeArticle, assembledProducts, line, name} = product;
            prodcutsArray.push({
                brandName: brand?.brandName,
                status: quotationProducts?.status,
                description: `${line?.name} ${name} ${quotationProducts?.mainMaterial} ${quotationProducts?.mainFinish} ${quotationProducts?.secondaryMaterial} ${quotationProducts?.secondaryFinishing} ${quotationProducts?.measureWide}`,
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

        const {quotationId} = project

        const quotation = await this.quotationRepository.findById(quotationId, {include: [{relation: 'customer'}, {relation: 'mainProjectManager'}, {relation: 'referenceCustomer'}, {relation: 'products', scope: {include: ['line', 'brand', 'document', {relation: 'quotationProducts', scope: {include: ['mainFinishImage']}}, {relation: 'assembledProducts', scope: {include: ['document']}}]}}]});
        const {customer, mainProjectManager, referenceCustomer, } = quotation;

        try {
            const properties: any = {
                "logo": logo,
                "customerName": `${customer?.name} ${customer?.lastName}`,
                "quotationId": quotationId,
                "projectManager": `${mainProjectManager?.firstName} ${mainProjectManager?.lastName}`,
                "createdAt": dayjs(quotation?.createdAt).format('DD/MM/YYYY'),
                "referenceCustomer": `${referenceCustomer?.firstName} ${referenceCustomer?.lastName}`,
                "products": prodcutsArray,
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

    }


    async deleteById(id: number) {
        await this.purchaseOrdersRepository.deleteById(id);
    }
}
