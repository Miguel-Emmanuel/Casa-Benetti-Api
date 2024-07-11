import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository, Where} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {PurchaseOrders, QuotationProductsWithRelations} from '../models';
import {ProformaRepository, ProjectRepository, PurchaseOrdersRepository, QuotationRepository} from '../repositories';

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
                                fields: ['id']
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
            const {provider, brand, quotationProducts} = proforma;
            return {
                id,
                provider: `${provider.name}`,
                brand: `${brand?.brandName}`,
                quantity: quotationProducts?.length ?? 0,
                status
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<PurchaseOrders>) {
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
                                fields: ['id', 'productId'],
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
        const {createdAt, proforma, status, accountPayableId} = purchaseOrders;
        const {provider, brand, quotationProducts, project} = proforma;
        const {customer, quotation} = project
        const {mainProjectManager} = quotation
        return {
            id,
            createdAt,
            provider,
            brand,
            customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
            mainPM: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
            accountPayableId,
            status,
            date: 'Aun estamos trabajando en calcular la fecha.',
            quotationProducts: quotationProducts.map((value: QuotationProductsWithRelations) => {
                const {SKU, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, measureWide, originCode, model, quantity} = value;
                const {line, name, document} = product;
                return {
                    SKU,
                    image: document?.fileURL,
                    model,
                    description: `${line?.name} ${name} ${mainMaterial} ${mainFinish} ${secondaryMaterial} ${secondaryFinishing} ${measureWide}`,
                    originCode,
                    quantity
                }
            })
        };
    }

    async updateById(id: number, purchaseOrders: PurchaseOrders,) {
        await this.purchaseOrdersRepository.updateById(id, purchaseOrders);
    }

    async deleteById(id: number) {
        await this.purchaseOrdersRepository.deleteById(id);
    }
}
