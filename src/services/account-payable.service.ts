import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, InclusionFilter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {AccountPayable} from '../models';
import {AccountPayableRepository, ProformaRepository, ProjectRepository, ProviderRepository, QuotationRepository} from '../repositories';
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
        @repository(ProviderRepository)
        public providerRepository: ProviderRepository,
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
                        {
                            relation: 'project',
                            scope: {
                                fields: ['id', 'customerId', 'quotationId', 'projectId'],
                                include: [
                                    {
                                        relation: 'customer',
                                        scope: {
                                            fields: ['id', 'name', 'lastName', 'secondLastName', 'groupId']
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
                const {id, proforma, purchaseOrders, total, totalPaid, balance, createdAt} = value;
                const {provider, project, branchId} = proforma;
                const {customerId, customer, projectId} = project
                return {
                    id,
                    provider: `${provider.name}`,
                    purchaseOrderId: purchaseOrders?.id ?? null,
                    customerId: customerId ?? null,
                    groupId: customer?.groupId ?? null,
                    projectId,
                    branchId,
                    total,
                    totalPaid,
                    balance,
                    createdAt
                }
            });
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findByProvider(filter?: Filter<AccountPayable>) {

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
                                fields: ['id', 'name']
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
                        {
                            relation: 'project',
                            scope: {
                                fields: ['id', 'customerId', 'quotationId', 'projectId'],
                                include: [
                                    {
                                        relation: 'customer',
                                        scope: {
                                            fields: ['id', 'name', 'lastName', 'secondLastName', 'groupId']
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
            const findAccountPayable = await this.accountPayableRepository.find(filter);
            let accountPayableByProviders = findAccountPayable.map((value, index) => {
                if (index == 0) {

                }
                const accountPayables = findAccountPayable.filter(item => item.proforma.provider.name === value.proforma.provider.name);
                const totalPaid = accountPayables.reduce((acc, item) => acc + item.totalPaid, 0);
                const total = accountPayables.reduce((acc, item) => acc + item.total, 0);
                const balance = accountPayables.reduce((acc, item) => acc + item.balance, 0);
                return {
                    id: value.id,
                    provider: value.proforma.provider.name,
                    providerId: value.proforma.provider.id,
                    totalPaid,
                    total,
                    balance,
                }
            });
            accountPayableByProviders = this.removeDuplicates(accountPayableByProviders);
            accountPayableByProviders = accountPayableByProviders.sort((a: any, b: any) => a.id - b.id);
            return accountPayableByProviders;
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    removeDuplicates(data: any) {
        const seen = new Set();
        return data.filter((item: any) => {
            if (seen.has(item.provider)) {
                return false;
            }
            seen.add(item.provider);
            return true;
        });
    };

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
                    relation: 'accountPayableHistories',
                    scope: {
                        include: [
                            {
                                relation: 'documents',
                                scope: {
                                    fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'accountPayableHistoryId']
                                }
                            }
                        ]
                    }
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
                    documents: item.documents,
                    status: item?.status,
                }
            })
            const {proforma, purchaseOrders, total, totalPaid, balance, currency} = findAccountPayable;
            const {provider, brand, project} = proforma;
            const {customer, quotation, projectId} = project
            const {closingDate, showroomManager, mainProjectManager} = quotation
            const values = {
                id,
                provider: `${provider.name}`,
                brand: brand?.brandName,
                purchaseOrderId: purchaseOrders?.id ?? null,
                projectId,
                customer: customer ? `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}` : 'Showroom',
                closingDate,
                showroomManager: `${showroomManager?.firstName} ${showroomManager?.lastName ?? ''}`,
                mainProjectManager: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                total,
                totalPaid,
                balance,
                accountPayableHistories,
                currency
            }
            return values;
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findByIdProvider(id: number, filter?: Filter<AccountPayable>, providerId: number = 0) {
        try {
            const getProvider = await this.providerRepository.findById(providerId, {fields: ['id', 'name']});

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
                    relation: 'accountPayableHistories',
                    scope: {
                        include: [
                            {
                                relation: 'documents',
                                scope: {
                                    fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'accountPayableHistoryId']
                                }
                            }
                        ]
                    }
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

            const findAccountPayable = await this.accountPayableRepository.find(filter);

            let accountPayableByProvider = findAccountPayable.filter(value => value.proforma.provider.name === getProvider.name);

            let accountPayableDataTotal = accountPayableByProvider.reduce((acc, apd) => {
                acc.totalPaid += apd.totalPaid;
                acc.total += apd.total;
                acc.balance += apd.balance;
                return acc;
            }, {totalPaid: 0, total: 0, balance: 0});

            let accountPayableHistories = [];

            for (const accPayable of accountPayableByProvider) {
                if (accPayable?.accountPayableHistories) {
                    for (const accPayHistories of accPayable?.accountPayableHistories) {
                        accountPayableHistories.push({
                            id: accPayHistories?.id,
                            concept: accPayHistories?.concept,
                            currency: accPayHistories?.currency,
                            amount: accPayHistories?.amount,
                            paymentDate: accPayHistories?.paymentDate,
                            documents: accPayHistories.documents,
                            status: accPayHistories?.status,
                        });
                    }
                }
            }

            const accountPayableDataByProvider = {
                id: id,
                provider: getProvider.name,
                ...accountPayableDataTotal,
                accountPayableHistories,
                accountByProject: accountPayableByProvider
            }


            return accountPayableDataByProvider;
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findProjectsByProvider(id: number, filter?: Filter<AccountPayable>, providerId: number = 0) {

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
                                fields: ['brandName']
                            }
                        },
                        {
                            relation: 'quotationProducts',
                            scope: {
                                fields: ['id']
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
                                            fields: ['id', 'name', 'lastName', 'secondLastName', 'groupId']
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
            const getProvider = await this.providerRepository.findById(providerId, {fields: ['id', 'name']});
            const findAccountPayable = await this.accountPayableRepository.find(filter);
            let accountPayableByProvider = findAccountPayable.filter(value => value.proforma.provider.name === getProvider.name);
            return accountPayableByProvider;
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
