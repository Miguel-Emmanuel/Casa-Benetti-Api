import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {CommissionPaymentRecord} from '../models';
import {CommissionPaymentRecordRepository, ProjectRepository, QuotationRepository} from '../repositories';

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

        const commissions = await this.commissionPaymentRecordRepository.find(filter);
        return commissions.map(value => {
            const {userName, user, type, projectId, commissionPercentage, commissionAmount, totalPaid, balance, percentagePaid, status, createdAt} = value;
            return {
                createdAt,
                name: userName ?? `${user?.firstName} ${user?.lastName}`,
                type,
                projectId,
                commissionPercentage,
                commissionAmount,
                totalPaid,
                balance,
                percentagePaid,
                status
            }
        });
    }

    async findById(id: number, filter?: FilterExcludingWhere<CommissionPaymentRecord>) {
        return this.commissionPaymentRecordRepository.findById(id, filter);
    }

    async updateById(id: number, commissionPaymentRecord: CommissionPaymentRecord,) {
        await this.commissionPaymentRecordRepository.updateById(id, commissionPaymentRecord);
    }

    async deleteById(id: number) {
        await this.commissionPaymentRecordRepository.deleteById(id);
    }
}
