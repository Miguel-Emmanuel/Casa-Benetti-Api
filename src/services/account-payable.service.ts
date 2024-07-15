import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, InclusionFilter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {AccountPayable} from '../models';
import {AccountPayableRepository, ProformaRepository, ProjectRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountPayableService {
    constructor(
        @repository(AccountPayableRepository)
        public accountPayableRepository: AccountPayableRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
    ) { }

    async create(accountPayable: AccountPayable) {
        try {
            return this.accountPayableRepository.create({...accountPayable, });
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }
    async find(filter?: Filter<AccountPayable>) {

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
                        },
                    ]
                }
            },
            {
                relation: 'purchaseOrders',
                scope: {
                    fields: ['id', 'accountPayableId']
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
        try {
            const findAccountPayable = await this.accountPayableRepository.find(filter)
            return findAccountPayable.map(value => {
                const {id, proforma, purchaseOrders, total, totalPaid, balance} = value;
                const {provider, projectId} = proforma;
                return {
                    id,
                    provider: `${provider.name}`,
                    purchaseOrderId: purchaseOrders?.id,
                    projectId,
                    total,
                    totalPaid,
                    balance
                }
            });
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findById(id: number, filter?: Filter<AccountPayable>) {
        try {

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
                                                fields: ['id', 'mainProjectManagerId', 'closingDate', 'showroomManagerId'],
                                                include: [
                                                    {
                                                        relation: 'mainProjectManager',
                                                        scope: {
                                                            fields: ['id', 'firstName', 'lastName']
                                                        }
                                                    },
                                                    {
                                                        relation: 'showroomManager',
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
                },
                {
                    relation: 'accountPayableHistories'
                },
                {
                    relation: 'purchaseOrders',
                    scope: {
                        fields: ['id', 'accountPayableId']
                    }
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
                        ...include
                    ]
                };
            const findAccountPayable = await this.accountPayableRepository.findById(id, filter);
            const accountPayableHistories = findAccountPayable?.accountPayableHistories?.map((item) => {
                return {
                    id: item?.id,
                    concept: item?.concept,
                    currency: item?.currency,
                    amount: item?.amount,
                    paymentDate: item?.paymentDate,
                    image: '',
                    status: item?.status,
                }
            })
            const {proforma, purchaseOrders, total, totalPaid, balance} = findAccountPayable;
            const {provider, brand, project, projectId} = proforma;
            const {customer, quotation} = project
            const {closingDate, showroomManager, mainProjectManager} = quotation
            const values = {
                id,
                provider: `${provider.name}`,
                brand: brand?.brandName,
                purchaseOrderId: purchaseOrders?.id ?? null,
                projectId,
                customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                closingDate,
                showroomManager: `${showroomManager?.firstName} ${showroomManager?.lastName ?? ''}`,
                mainProjectManager: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                total,
                totalPaid,
                balance,
                accountPayableHistories
            }
            return values;
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async count(where?: Where<AccountPayable>) {
        try {
            return this.accountPayableRepository.count(where);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async updateById(id: number, brand: AccountPayable,) {
        try {
            await this.accountPayableRepository.updateById(id, brand);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }
}
