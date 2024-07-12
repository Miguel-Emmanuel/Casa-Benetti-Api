import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, InclusionFilter, IsolationLevel, Where, repository} from '@loopback/repository';
import fs from "fs/promises";
import {ExchangeRateQuotationE, PurchaseOrdersStatus, TypeUserE} from '../enums';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {Document, Proforma, Quotation} from '../models';
import {AccountPayableRepository, BrandRepository, DocumentRepository, ProformaRepository, ProjectRepository, ProviderRepository, PurchaseOrdersRepository, QuotationProductsRepository, UserRepository} from '../repositories';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProformaService {
    constructor(
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(ProviderRepository)
        public providerRepository: ProviderRepository,
        @repository(BrandRepository)
        public brandRepository: BrandRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(AccountPayableRepository)
        public accountPayableRepository: AccountPayableRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) { }

    async create(data: {proforma: Omit<Proforma, 'id'>, document: Document}) {
        try {
            const transaction = await this.projectRepository.dataSource.beginTransaction(IsolationLevel.SERIALIZABLE);
            const {proforma, document} = data

            const findProject = await this.projectRepository.findById(proforma.projectId, {
                include: [{
                    relation: "quotation",
                }]
            })

            const findQuotationProducts = await this.quotationProductsRepository.find({
                where: {
                    quotationId: findProject.quotationId,
                    providerId: proforma.providerId,
                    brandId: proforma.brandId
                }
            })


            const findProviderBrand = await this.findProviderBrand(proforma)

            if (findProviderBrand)
                return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

            if (!document)
                return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');

            const newProforma = await this.proformaRepository.create({...proforma, branchId: findProject.branchId, }, /*{transaction}*/);

            if (findQuotationProducts.length > 0) {
                findQuotationProducts.map(async (item) => {
                    await this.quotationProductsRepository.updateById(item.id, {
                        proformaId: newProforma.id
                    }, /*{transaction}*/)
                })
            }
            await this.createDocument(newProforma.id, document, transaction)

            await this.sendEmailProforma(newProforma.id, document.fileURL);
            await this.createAdvancePaymentAccount(proforma, newProforma.id!, transaction)

            return newProforma
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async sendEmailProforma(proformaId?: number, fileURL?: string) {

        const users = await this.userRepository.find({where: {typeUser: TypeUserE.ADMINISTRADOR}})
        let attachments = undefined;
        if (fileURL) {
            const nameFile = fileURL.replace(`${process.env.URL_BACKEND}/files/`, '')
            const content = `data:application/pdf;base64,${await fs.readFile(`${process.cwd()}/.sandbox/${nameFile}`, {encoding: 'base64'})}`
            attachments = [
                {
                    filename: 'proforma.pdf',
                    content
                }
            ]
        }
        const proforma = await this.proformaRepository.findById(proformaId, {
            include: [
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
                        ]
                    }
                },
                {
                    relation: 'provider',
                    scope: {
                        fields: ['id', 'name']
                    }
                },
                {
                    relation: 'brand',
                    scope: {
                        fields: ['id', 'brandName']
                    }
                },
            ]
        })
        const {projectId, project, provider, brand, proformaDate, proformaAmount, currency} = proforma
        const {customer} = project
        const option = {
            templateId: SendgridTemplates.NEW_PROFORMA.id,
            attachments: attachments,
            dynamicTemplateData: {
                subject: SendgridTemplates.NEW_PROFORMA.subject,
                projectId,
                customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                proformaId,
                providerName: provider.name,
                brandName: brand.brandName,
                proformaDate,
                amount: proformaAmount,
                currency,
            }
        }
        for (let index = 0; index < users.length; index++) {
            const element = users[index];
            const optionsDynamic = {
                to: element.email,
                ...option,
            };
            await this.sendgridService.sendNotification(optionsDynamic);
        }
    }

    async createDocument(proformaId: number | undefined, document: Document, transaction: any) {
        if (proformaId) {
            if (document && !document?.id) {
                await this.proformaRepository.document(proformaId).create(document, /*{transaction}*/);
            } else if (document) {
                await this.documentRepository.updateById(document.id, {...document}, /*{transaction}*/);
            }
        }
    }

    async find(filter?: Filter<Proforma>) {
        const include: InclusionFilter[] = [
            {
                relation: 'brand',
                scope: {
                    fields: ['brandName']
                }
            },
            {
                relation: 'document',
                scope: {
                    fields: ['fileURL', 'name', 'extension', 'id']
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
        try {
            return (await this.proformaRepository.find(filter)).map(value => {
                const {id, proformaId, brand, proformaDate, proformaAmount, currency, document} = value;
                return {
                    id,
                    proformaId,
                    brandName: brand?.brandName,
                    proformaDate,
                    proformaAmount,
                    currency,
                    document
                }
            });
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findById(id: number, filter?: Filter<Proforma>) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'document',
                    scope: {
                        fields: ['id', 'fileURL', 'name', 'extension']
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
            return this.proformaRepository.findById(id, filter);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async count(where?: Where<Proforma>) {
        try {
            return this.proformaRepository.count(where);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async updateById(id: number, data: {proforma: Omit<Proforma, 'id'>, document: Document}) {
        try {
            const {proforma, document} = data

            await this.findByIdProforma(id)
            await this.findByIdProvider(proforma.providerId)
            await this.findByIdProject(proforma.projectId)
            await this.findByIdBrand(proforma.brandId)
            const findProviderBrand = await this.findProviderBrand(proforma)

            if (findProviderBrand)
                return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

            if (!document)
                return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');
            await this.proformaRepository.updateById(id, proforma);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async createAdvancePaymentAccount(proforma: Proforma, proformId: number, transaction: any) {
        const {projectId, proformaAmount} = proforma
        const findQuotation = await this.projectRepository.findById(proforma.projectId, {
            include: [{
                relation: "quotation",
            }]
        }, /*{transaction}*/)



        const {quotation} = findQuotation
        const {id, customerId, proofPaymentQuotations, exchangeRateQuotation, isFractionate, typeFractional} = quotation;

        const {conversionAdvance, advance, } = this.getPricesQuotation(quotation);
        console.log("FINDQ", findQuotation);

        const accountsPayable = await this.accountPayableRepository.create({currency: exchangeRateQuotation, total: proforma.proformaAmount ?? 0, proformaId: proformId}, /*{transaction}*/);

        if (conversionAdvance && advance && conversionAdvance >= advance) {
            await this.purchaseOrdersRepository.create({accountPayableId: accountsPayable.id, status: PurchaseOrdersStatus.NUEVA, proformaId: proformId}, /*{transaction}*/)
        }


    }
    getPricesQuotation(quotation: Quotation) {
        const {exchangeRateQuotation, } = quotation;
        if (exchangeRateQuotation === ExchangeRateQuotationE.EUR) {
            const {subtotalEUR, percentageAdditionalDiscount, additionalDiscountEUR, percentageIva, ivaEUR, totalEUR, percentageAdvanceEUR,
                advanceEUR, exchangeRate, advanceCustomerEUR, conversionAdvanceEUR, balanceEUR, exchangeRateAmountEUR} = quotation
            const body = {
                subtotal: subtotalEUR,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountEUR,
                percentageIva: percentageIva,
                iva: ivaEUR,
                total: totalEUR,
                percentageAdvance: percentageAdvanceEUR,
                advance: advanceEUR,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountEUR,
                advanceCustomer: advanceCustomerEUR,
                conversionAdvance: conversionAdvanceEUR,
                balance: balanceEUR,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.USD) {
            const {subtotalUSD, percentageAdditionalDiscount, additionalDiscountUSD, percentageIva, ivaUSD, totalUSD, percentageAdvanceUSD,
                advanceUSD, exchangeRate, advanceCustomerUSD, conversionAdvanceUSD, balanceUSD, exchangeRateAmountUSD} = quotation
            const body = {
                subtotal: subtotalUSD,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountUSD,
                percentageIva: percentageIva,
                iva: ivaUSD,
                total: totalUSD,
                percentageAdvance: percentageAdvanceUSD,
                advance: advanceUSD,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountUSD,
                advanceCustomer: advanceCustomerUSD,
                conversionAdvance: conversionAdvanceUSD,
                balance: balanceUSD,
            }
            return body;
        } else if (exchangeRateQuotation === ExchangeRateQuotationE.MXN) {
            const {subtotalMXN, percentageAdditionalDiscount, additionalDiscountMXN, percentageIva, ivaMXN, totalMXN, percentageAdvanceMXN,
                advanceMXN, exchangeRate, advanceCustomerMXN, conversionAdvanceMXN, balanceMXN, exchangeRateAmountMXN} = quotation
            const body = {
                subtotal: subtotalMXN,
                percentageAdditionalDiscount: percentageAdditionalDiscount,
                additionalDiscount: additionalDiscountMXN,
                percentageIva: percentageIva,
                iva: ivaMXN,
                total: totalMXN,
                percentageAdvance: percentageAdvanceMXN,
                advance: advanceMXN,
                exchangeRate: exchangeRate,
                exchangeRateAmount: exchangeRateAmountMXN,
                advanceCustomer: advanceCustomerMXN,
                conversionAdvance: conversionAdvanceMXN,
                balance: balanceMXN,
            }
            return body;
        }
        const body = {
            subtotal: null,
            percentageAdditionalDiscount: null,
            additionalDiscount: null,
            percentageIva: null,
            iva: null,
            total: null,
            percentageAdvance: null,
            advance: null,
            exchangeRate: null,
            exchangeRateAmount: null,
            advanceCustomer: null,
            conversionAdvance: null,
            balance: null,
        }
        return body;
    }
    async findProviderBrand(proforma: Proforma): Promise<boolean> {
        const {projectId, providerId, brandId} = proforma
        const findProviderBrand = await this.proformaRepository.findOne({
            where: {
                projectId,
                providerId,
                brandId,
            }
        })
        return findProviderBrand ? true : false
    }
    async findByIdProforma(id: number) {
        const proforma = await this.proformaRepository.findOne({where: {id}});
        if (!proforma)
            throw this.responseService.notFound("La proforma no se ha encontrado.")
    }
    async findByIdProvider(id?: number) {
        const provider = await this.providerRepository.findOne({where: {id}});
        if (!provider)
            throw this.responseService.notFound("El proveedor no se ha encontrado.")
    }
    async findByIdProject(id?: number) {
        const project = await this.projectRepository.findOne({where: {id}});
        if (!project)
            throw this.responseService.notFound("El proyecto no se ha encontrado.")
    }
    async findByIdBrand(id?: number) {
        const brand = await this.brandRepository.findOne({where: {id}});
        if (!brand)
            throw this.responseService.notFound("La marca no se ha encontrado.")
    }
}
