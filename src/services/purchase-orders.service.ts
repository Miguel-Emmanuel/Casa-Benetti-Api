import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository, Where} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {PurchaseOrders} from '../models';
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
        return this.purchaseOrdersRepository.findById(id, filter);
    }

    async updateById(id: number, purchaseOrders: PurchaseOrders,) {
        await this.purchaseOrdersRepository.updateById(id, purchaseOrders);
    }

    async deleteById(id: number) {
        await this.purchaseOrdersRepository.deleteById(id);
    }
}
