import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, Where, repository} from '@loopback/repository';
import {Response, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import dayjs from 'dayjs';
import fs from "fs/promises";
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
                    fields: ['closingDate', 'branchId', 'percentageIva', 'isFractionate', 'totalEUR', 'totalMXN', 'totalUSD',]
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
        const advancePaymentRecordsFind = await this.accountsReceivableRepository.find({where: {projectId: accountsReceivable.projectId}, include: ['advancePaymentRecords']});

        const project = await this.findProjectById(accountsReceivable.projectId);
        const {projectId, customer, quotation} = project;
        const {showroomManager, mainProjectManager, closingDate} = quotation;
        let data = [];
        for (let index = 0; index < advancePaymentRecordsFind.length; index++) {
            const element = advancePaymentRecordsFind[index];
            const {totalSale, updatedTotal, totalPaid, balance, advancePaymentRecords} = element;
            try {
                let balanceDetail = totalSale;
                data.push({
                    today: dayjs().format('DD/MM/YYYY'),
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
                    advancePaymentRecords: advancePaymentRecords.map(value => {
                        balanceDetail = balanceDetail - value.subtotalAmountPaid;
                        return {
                            ...value,
                            balanceDetail: balanceDetail.toFixed(2),
                            paymentDate: dayjs(value.paymentDate).format('DD/MM/YYYY'),
                            amountPaid: value.subtotalAmountPaid.toFixed(2),
                            subtotalAmountPaid: value.subtotalAmountPaid.toFixed(2),
                            conversionAmountPaid: value.subtotalAmountPaid.toFixed(2),
                        }
                    })
                })

            } catch (error) {
            }
        }
        const defaultImage = `data:image/svg+xml;base64,${await fs.readFile(`${process.cwd()}/src/templates/images/NoImageProduct.svg`, {encoding: 'base64'})}`

        const properties: any = {
            data,
            image: defaultImage,
            imagetwo: 'https://api.casa-benetti.guaodev.com//files/xWFvhL_silla.png',
        }
        const nameFile = `estado_de_cuenta_${dayjs().format()}.pdf`
        const buffer = await this.pdfService.createPDFWithTemplateHtmlToBuffer(`${process.cwd()}/src/templates/estado_cuenta.html`, properties, {format: 'A3'});
        this.response.setHeader('Content-Disposition', `attachment; filename=${nameFile}`);
        this.response.setHeader('Content-Type', 'application/pdf');
        return this.response.status(200).send(buffer)

    }

    async findProjectById(id: number) {
        const project = await this.projectRepository.findById(id, {
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'showroomManagerId', 'closingDate', 'totalEUR', 'totalMXN', 'totalUSD', 'mainProjectManagerId'],
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
                    fields: ['closingDate', 'branchId', 'percentageIva', 'isFractionate', 'totalEUR', 'totalMXN', 'totalUSD',]

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
