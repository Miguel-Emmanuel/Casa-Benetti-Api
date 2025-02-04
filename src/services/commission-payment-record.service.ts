import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import BigNumber from 'bignumber.js';
import {AccessLevelRolE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {CommissionPaymentRecord} from '../models';
import {CommissionPaymentRecordRepository, ProjectRepository, QuotationRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CommissionPaymentRecordService {
    constructor(
        @repository(CommissionPaymentRecordRepository)
        public commissionPaymentRecordRepository: CommissionPaymentRecordRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }


    // async create(commissionPaymentRecord: Omit<CommissionPaymentRecord, 'id'>,) {
    //     return this.commissionPaymentRecordRepository.create(commissionPaymentRecord);
    // }

    async find(filter?: Filter<CommissionPaymentRecord>,) {
        const accessLevel = this.user.accessLevel;
        let where: any = {};
        if (accessLevel === AccessLevelRolE.SUCURSAL) {
            const projects = (await this.projectRepository.find({where: {branchId: this.user.branchId}})).map(value => value.id);
            where = {...where, projectId: {inq: [...projects]}}
        }

        if (accessLevel === AccessLevelRolE.PERSONAL) {
            const quotations = (await this.quotationRepository.find({where: {mainProjectManagerId: this.user.id}})).map(value => value.id);
            const projects = (await this.projectRepository.find({where: {quotationId: {inq: [...quotations]}}})).map(value => value.id);
            where = {...where, projectId: {inq: [...projects]}}
        }

        if (filter?.where) {
            filter.where = {...filter.where, ...where}
        } else {
            filter = {...filter, where: {...where}};
        }

        const include: InclusionFilter[] = [
            {
                relation: 'user',
            },
            {
                relation: 'project',
                scope: {
                    fields: ['id', 'branchId', 'projectId'],
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

        const commissions = await this.commissionPaymentRecordRepository.find(filter);
        return commissions.map(value => {
            const {userName, user, type, projectId, commissionPercentage, commissionAmount, totalPaid, balance, percentagePaid, status, createdAt, project, id} = value;
            return {
                id,
                createdAt,
                name: userName ?? `${user?.firstName} ${user?.lastName}`,
                type,
                projectId: project?.projectId,
                commissionPercentage,
                commissionAmount,
                totalPaid,
                balance,
                percentagePaid,
                status,
                branchId: project?.branchId
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<CommissionPaymentRecord>) {
        const include: InclusionFilter[] = [
            {
                relation: 'project',
                scope: {
                    fields: ['id', 'quotationId', 'customerId', 'projectId'],
                    include: [
                        {
                            relation: 'quotation',
                            scope: {
                                fields: ['id', 'showroomManagerId'],
                                include: [
                                    {
                                        relation: 'showroomManager',
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
                                fields: ['id', 'name', 'lastName', 'secondLastName']
                            }
                        },
                    ]
                }
            },
            {
                relation: 'user',
            },
            {
                relation: 'commissionPayments',
                scope: {
                    include: [
                        {
                            relation: 'documents',
                            scope: {
                                fields: ['id', 'createdAt', 'fileURL', 'name', 'extension', 'commissionPaymentId']
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
        const commission = await this.commissionPaymentRecordRepository.findOne({where: {id}, ...filter});
        if (!commission)
            throw this.responseService.notFound('La comision no existe.');

        const {project, projectId, user, userName, type, percentagePaid, totalPaid, commissionAmount, balance, status, commissionPayments, commissionPercentage} = commission;
        const {quotation, customer} = project;
        const {showroomManager} = quotation;
        return {
            id,
            showroomManager: `${showroomManager?.firstName} ${showroomManager?.lastName ?? ''}`,
            projectId: project?.projectId,
            customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
            name: userName ?? `${user?.firstName} ${user?.lastName}`,
            type,
            percentagePaid,
            totalPaid,
            commissionAmount,
            balance,
            exchangeRate: this.roundToTwoDecimals(commissionAmount * 19.25),
            status,
            commissionPayments,
            commissionPercentage
        }
    }

    roundToTwoDecimals(num: number): number {
        return Number(new BigNumber(num).toFixed(2));
    }

    async updateById(id: number, commissionPaymentRecord: CommissionPaymentRecord,) {
        await this.commissionPaymentRecordRepository.updateById(id, commissionPaymentRecord);
    }

    async deleteById(id: number) {
        await this.commissionPaymentRecordRepository.deleteById(id);
    }

    //

    async findCommissionPaymentRecord(id: number) {
        const commissionPaymentRecord = await this.commissionPaymentRecordRepository.findOne({where: {id}});
        if (!commissionPaymentRecord)
            throw this.responseService.notFound('La comision no existe.');
        return commissionPaymentRecord
    }
}
