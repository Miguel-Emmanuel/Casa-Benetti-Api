import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import dayjs from 'dayjs';
import {AccessLevelRolE} from '../enums';
import {ResponseServiceBindings} from '../keys';
import {AccountsReceivable} from '../models';
import {AccountsReceivableRepository, ProjectRepository, QuotationRepository, UserRepository} from '../repositories';
import {PdfService} from './pdf.service';
import {ResponseService} from './response.service';

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
        @service()
        public pdfService: PdfService,
        @inject(RestBindings.Http.RESPONSE)
        private response: Response,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
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

        const include: InclusionFilter[] = [
            {
                relation: 'customer',
                scope: {
                    fields: ['name', 'lastName', 'secondLastName', 'groupId']
                }
            },
            {
                relation: 'quotation',
                scope: {
                    fields: ['closingDate']
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
        return this.accountsReceivableRepository.find(filter);
    }

    async getAccountStatement(id: number) {

        const accountsReceivable = await this.findAccountReceivable(id);
        const project = await this.findProjectById(accountsReceivable.projectId);
        console.log(project)
        const {projectId, customer, quotation} = project;
        const {showroomManager, mainProjectManager, closingDate} = quotation;
        const {totalSale, updatedTotal, totalPaid, balance, advancePaymentRecords} = accountsReceivable;
        try {
            const properties: any = {
                projectId,
                customer: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                projectManager: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                showroomManager: `${showroomManager?.firstName} ${showroomManager?.lastName ?? ''}`,
                closingDate: dayjs(closingDate).format('DD/MM/YYYY'),
                totalSale,
                updatedTotal,
                totalPaid,
                totalPercentage: 0,
                balance,
                advancePaymentRecords
            }

            console.log(properties)
            // const nameFile = `estado_de_cuenta_${dayjs().format()}.pdf`
            // const buffer = await this.pdfService.createPDFWithTemplateHtmlToBuffer(`${process.cwd()}/src/templates/estado_cuenta.html`, properties, {format: 'A3'});
            // this.response.setHeader('Content-Disposition', `attachment; filename=${nameFile}`);
            // this.response.setHeader('Content-Type', 'application/pdf');
            // return this.response.status(200).send(buffer)
        } catch (error) {

        }
    }

    async findProjectById(id: number) {
        const project = await this.projectRepository.findById(id, {
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'showroomManagerId', 'closingDate', 'totalEUR', 'totalMXN', 'totalUSD'],
                        include: [
                            {
                                relation: 'showroomManager',
                                scope: {
                                    fields: ['id', 'firstName', 'lastName']
                                }
                            },
                            {
                                relation: 'mainProjectManager',
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
                        fields: ['name', 'lastName', 'secondLastName']
                    }
                }
            ]
        });
        return project;
    }
    async findAccountReceivable(id: number) {
        const accountsReceivable = await this.accountsReceivableRepository.findOne({where: {id}, include: ['advancePaymentRecords']});
        if (!accountsReceivable)
            throw this.responseService.badRequest('La cuenta por cobrar no existe.');
        return accountsReceivable
    }

    async findById(id: number, filter?: FilterExcludingWhere<AccountsReceivable>) {
        const include: InclusionFilter[] = [
            {
                relation: 'advancePaymentRecords',
                scope: {
                    include: [{
                        relation: 'documents',
                        scope: {
                            fields: ['createdAt', 'createdBy', 'fileURL', 'name', 'extension', 'advancePaymentRecordId', 'updatedBy', 'updatedAt']
                        }
                    }]
                }
            },
            {
                relation: 'customer',
                scope: {
                    fields: ['name', 'lastName', 'secondLastName', 'groupId']
                }
            },
            {
                relation: 'quotation',
                scope: {
                    fields: ['closingDate']
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
