import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {AccessLevelRolE} from '../enums';
import {AccountsReceivable} from '../models';
import {AccountsReceivableRepository, QuotationRepository, UserRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountsReceivableService {
    constructor(
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
    ) { }

    async count(where?: Where<AccountsReceivable>,) {
        return this.accountsReceivableRepository.count(where);
    }
    async find(filter?: Filter<AccountsReceivable>,) {
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
        return this.accountsReceivableRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<AccountsReceivable>) {
        const include: InclusionFilter[] = [
            {
                relation: 'advancePaymentRecords',
                scope: {
                    include: [{
                        relation: 'documents',
                        scope: {
                            fields: ['id', 'createdAt', 'createdBy', 'fileURL', 'name', 'extension', 'advancePaymentRecordId', 'updatedBy', 'updatedAt']
                        }
                    }]
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

        const accountsReceivable = await this.accountsReceivableRepository.findById(id, filter);
        for (let index = 0; index < accountsReceivable?.advancePaymentRecords?.length; index++) {
            const element = accountsReceivable?.advancePaymentRecords[index];
            for (let index = 0; index < element?.documents?.length; index++) {
                const document = element?.documents[index];
                if (document) {
                    const element: any = document;
                    const createdBy = await this.userRepository.findByIdOrDefault(element.createdBy);
                    const updatedBy = await this.userRepository.findByIdOrDefault(element.updatedBy);
                    element.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
                    element.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
                }

            }
        }
        return accountsReceivable
    }

    async updateById(id: number, accountsReceivable: AccountsReceivable,) {
        await this.accountsReceivableRepository.updateById(id, accountsReceivable);
    }
}
