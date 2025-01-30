import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, InclusionFilter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import dayjs from 'dayjs';
import fs from "fs/promises";
import {CurrencyE, ExchangeRateQuotationE, ProformaCurrencyE, TypeQuotationE, TypeUserE} from '../enums';
import {ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {Document, Proforma, ProformaWithRelations, Quotation} from '../models';
import {AccountPayableRepository, AccountsReceivableRepository, BrandRepository, DocumentRepository, ProformaRepository, ProjectRepository, ProviderRepository, PurchaseOrdersRepository, QuotationProductsRepository, QuotationRepository, UserRepository} from '../repositories';
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
        @repository(QuotationRepository)
        public quotationRepository: QuotationRepository,
        @repository(AccountsReceivableRepository)
        public accountsReceivableRepository: AccountsReceivableRepository,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(data: {proforma: Omit<Proforma, 'id'>, document: Document}) {
        try {
            const {proforma, document} = data

            const findQuotation = await this.quotationRepository.findById(proforma.quotationId);

            // if (findProject.status === ProjectStatusE.CERRADO) {
            //     await transaction.commit();
            //     return this.responseService.badRequest("El proyecto ha sido cerrado y no es posible realizar actualizaciones.");
            // }

            const findQuotationProducts = await this.quotationProductsRepository.find({
                where: {
                    quotationId: proforma.quotationId,
                    providerId: proforma.providerId,
                    brandId: proforma.brandId
                }
            })


            const findProviderBrand = await this.findProviderBrand(proforma)

            if (findProviderBrand)
                return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

            if (!document)
                return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');

            const newProforma = await this.proformaRepository.create({...proforma, branchId: findQuotation.branchId});

            if (findQuotationProducts.length > 0) {
                findQuotationProducts.map(async (item) => {
                    await this.quotationProductsRepository.updateById(item.id, {
                        proformaId: newProforma.id
                    })
                })
            }
            await this.createDocument(newProforma.id, document)
            await this.sendEmailProforma(newProforma.id, document.fileURL);
            await this.createAdvancePaymentAccount(proforma, newProforma.id!, findQuotation.typeQuotation)

            return {newProforma}
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async proformasByQuotationId(quotationId: number) {
        try {

            const proformas = await this.proformaRepository.find({
                where: {quotationId}
            })

            return proformas;
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );

        }
    }

    async sendEmailProforma(proformaId?: number, fileURL?: string) {

        const users = await this.userRepository.find({where: {typeUser: TypeUserE.ADMINISTRADOR}})
        let attachments = undefined;
        if (fileURL && fileURL.includes('/files/')) {
            try {
                const nameFile = fileURL.replace(`${process.env.URL_BACKEND}//files//`, '')
                const content = `${await fs.readFile(`${process.cwd()}/.sandbox/${nameFile}`, {encoding: 'base64'})}`
                attachments = [
                    {
                        content: content,
                        filename: "proforma.pdf",
                        type: "application/pdf",
                        disposition: "attachment"
                    }
                ]
            } catch (error) {

            }
        }
        const proforma = await this.proformaRepository.findById(proformaId, {
            include: [
                // {
                //     relation: 'project',
                //     scope: {
                //         fields: ['id', 'customerId', 'quotationId', 'projectId', 'quotation'],
                //         include: [
                //             {
                //                 relation: 'customer',
                //                 scope: {
                //                     fields: ['id', 'name', 'lastName', 'secondLastName']
                //                 }
                //             },
                //             {
                //                 relation: 'quotation'
                //             }
                //         ]
                //     }
                // },
                {
                    relation: 'quotation',
                    scope: {
                        include: [
                            {
                                relation: 'customer'
                            }
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
        const {quotation, provider, brand, proformaDate, proformaAmount, currency, proformaId: proId} = proforma

        const {customer} = quotation;

        const option = {
            templateId: SendgridTemplates.NEW_PROFORMA.id,
            attachments: attachments,
            dynamicTemplateData: {
                subject: SendgridTemplates.NEW_PROFORMA.subject,
                // projectId: project.projectId, // TODO: Cambiar por el id del proyecto
                customerName: quotation?.typeQuotation === TypeQuotationE.GENERAL ? `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}` : 'Showroom',
                proformaId: proId,
                providerName: provider.name,
                brandName: brand.brandName,
                proformaDate: dayjs(proformaDate).format('DD/MM/YYYY'),
                amount: this.setCurrencyToAmount(proformaAmount, currency),
                currency,
            }
        }
        const emails = []
        for (let index = 0; index < users.length; index++) {
            const element = users[index];
            emails.push(element.email)
        }
        for (let index = 0; index < emails?.length; index++) {
            const elementMail = emails[index];
            const optionsDynamic = {
                to: elementMail,
                ...option,
            };
            await this.sendgridService.sendNotification(optionsDynamic);
        }
    }

    setCurrencyToAmount(proformaAmount: number, currency: ProformaCurrencyE) {
        return currency === ProformaCurrencyE.EURO ? `${proformaAmount}€` : `$${proformaAmount}`
    }

    async createDocument(proformaId: number | undefined, document: Document) {

        if (proformaId) {
            if (document && !document?.id) {
                await this.proformaRepository.document(proformaId).create(document);
            } else if (document) {
                await this.documentRepository.updateById(document.id, {...document});
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
                    fields: ['fileURL', 'name', 'extension', 'id', 'proformaId']
                }
            },
            {
                relation: 'provider',
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
                const {id, proformaId, brand, proformaDate, proformaAmount, currency, document, projectId, provider} = value;
                return {
                    id,
                    proformaId,
                    brandName: brand?.brandName,
                    proformaDate,
                    proformaAmount,
                    currency,
                    document,
                    projectId,
                    providerName: `${provider?.name}`
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
                        fields: ['id', 'fileURL', 'name', 'extension', 'proformaId']
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
            const findProviderBrand = await this.findProviderBrandUpdate(id, proforma)
            const findProformaAccount = await this.findAccountPayable(id)

            if (findProformaAccount && findProformaAccount?.accountPayable && findProformaAccount?.accountPayable.accountPayableHistories)
                return this.responseService.badRequest('¡Oh, no! Ya hay un pago registrado, y no es posible modificarlo.');

            if (findProviderBrand)
                return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

            if (!document)
                return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');

            await this.createDocument(id, document)
            const oldData = await this.getDataProforma(id);
            await this.proformaRepository.updateById(id, proforma);
            await this.accountPayableUpdate(findProformaAccount?.accountPayable?.id, proforma)
            const newData = await this.getDataProforma(id);
            await this.sendEmailProformaUpdate(id, oldData, newData, newData?.document.fileURL)
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async getDataProforma(proformaId: number) {
        const proforma = await this.proformaRepository.findById(proformaId, {
            include: [
                {
                    relation: 'document',
                    scope: {
                        fields: ['id', 'fileURL', 'name', 'extension', 'proformaId']
                    }
                },
                {
                    relation: 'project',
                    scope: {
                        fields: ['id', 'customerId', 'quotationId', 'projectId', 'quotation'],
                        include: [
                            {
                                relation: 'customer',
                                scope: {
                                    fields: ['id', 'name', 'lastName', 'secondLastName']
                                }
                            },
                            {
                                relation: 'quotation'
                            }
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
        return proforma
    }

    async sendEmailProformaUpdate(proformaId: number, oldData: ProformaWithRelations, newData: ProformaWithRelations, fileURL?: string) {

        const users = await this.userRepository.find({where: {typeUser: TypeUserE.ADMINISTRADOR}})
        let attachments = undefined;
        if (fileURL && fileURL.includes('/files/')) {
            try {
                const nameFile = fileURL.replace(`${process.env.URL_BACKEND}//files//`, '')
                const content = `${await fs.readFile(`${process.cwd()}/.sandbox/${nameFile}`, {encoding: 'base64'})}`
                attachments = [
                    {
                        content: content,
                        filename: "proforma.pdf",
                        type: "application/pdf",
                        disposition: "attachment"
                    }
                ]
            } catch (error) {
                console.log('error: ', error)

            }
        }
        let objectOld = null;
        let objectNew = null;
        if (oldData) {
            const {provider, brand, proformaDate, proformaAmount, currency} = oldData;
            objectOld = {
                providerNameOld: provider.name,
                brandNameOld: brand.brandName,
                proformaDateOld: dayjs(proformaDate).format('DD/MM/YYYY'),
                amountOld: this.setCurrencyToAmount(proformaAmount, currency),
                currencyOld: currency,
            }
        }

        if (newData) {
            const {provider, brand, proformaDate, proformaAmount, currency} = newData;
            objectNew = {
                providerNameNew: provider.name,
                brandNameNew: brand.brandName,
                proformaDateNew: dayjs(proformaDate).format('DD/MM/YYYY'),
                amountNew: this.setCurrencyToAmount(proformaAmount, currency),
                currencyNew: currency,
            }
        }
        const {projectId, project, proformaId: proId} = oldData;
        const {customer, quotation} = project
        const option = {
            templateId: SendgridTemplates.UPDATE_PROFORMA.id,
            attachments: attachments,
            dynamicTemplateData: {
                subject: SendgridTemplates.UPDATE_PROFORMA.subject,
                projectId: project.projectId,
                // customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                customerName: quotation?.typeQuotation === TypeQuotationE.GENERAL ? `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}` : 'Showroom',
                proformaId: proId,
                ...objectOld,
                ...objectNew
            }
        }
        for (let index = 0; index < users.length; index++) {
            const element = users[index];
            const optionsDynamic = {
                to: element.email,
                ...option,
            };
            console.log(optionsDynamic)
            await this.sendgridService.sendNotification(optionsDynamic);
        }
    }

    async createAdvancePaymentAccount(proforma: Proforma, proformaId: number, typeQuotation: TypeQuotationE) {
        const {quotationId} = proforma
        const findQuotation = await this.quotationRepository.findById(quotationId)

        //productquote, filtrarlo por provedor y marca, el primer elemento tomo currency,
        //find proyecto, AccountsReceivable y projectid toimar total pagado, si veo que es mas de 1 filtrar por el currency

        const findQuotationProducts = await this.quotationProductsRepository.findOne({
            where: {
                quotationId,
                proformaId,
                providerId: proforma.providerId,
                brandId: proforma.brandId
            }
        })

        if (!findQuotationProducts)
            throw this.responseService.notFound("No se han encontrado productos relacionados con proforma")

        const findAccountsReceivable = await this.accountsReceivableRepository.find({
            where: {
                quotationId
            }
        })

        let totalPaid = 0
        let accountsReceivableId = undefined
        let newCurrency = ExchangeRateQuotationE.EUR

        if (findAccountsReceivable.length === 1) {
            totalPaid = findAccountsReceivable[0].totalPaid
            accountsReceivableId = findAccountsReceivable[0].id
        }

        else if (findAccountsReceivable.length > 1) {
            const {currency} = findQuotationProducts
            newCurrency = currency === CurrencyE.USD ? ExchangeRateQuotationE.USD :
                currency === CurrencyE.PESO_MEXICANO ? ExchangeRateQuotationE.MXN : ExchangeRateQuotationE.EUR

            totalPaid = findAccountsReceivable.find((item) => item.typeCurrency === newCurrency)?.totalPaid ?? 0
            accountsReceivableId = findAccountsReceivable.find((item) => item.typeCurrency === newCurrency)?.id ?? undefined
        }

        const currencyAccountPayable = proforma.currency === ProformaCurrencyE.USD ? ExchangeRateQuotationE.USD : ProformaCurrencyE.PESO_MEXICANO ? ExchangeRateQuotationE.MXN : ExchangeRateQuotationE.EUR

        let advance = 0
        if (newCurrency === ExchangeRateQuotationE.EUR) {
            advance = findQuotation.advanceEUR
        }
        else if (newCurrency === ExchangeRateQuotationE.USD) {
            advance = findQuotation.advanceUSD
        }
        if (newCurrency === ExchangeRateQuotationE.MXN) {
            advance = findQuotation.advanceMXN
        }

        const accountsPayable = await this.accountPayableRepository.create({currency: currencyAccountPayable, total: proforma.proformaAmount ?? 0, proformaId, balance: proforma.proformaAmount ?? 0});

        //cambiar totalpagado
        if (typeQuotation === TypeQuotationE.SHOWROOM || this.user.isMaster === true) {
            // const purchaseorder = await this.purchaseOrdersRepository.create({accountPayableId: accountsPayable.id, status: PurchaseOrdersStatus.NUEVA, proformaId, accountsReceivableId, projectId})
            const purchaseOrder = await this.purchaseOrdersRepository.findOne({
                where: {
                    quotationId,
                    providerId: proforma.providerId,
                }
            });

            if (!purchaseOrder)
                return this.responseService.notFound("No se ha encontrado la orden de compra");

            await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {accountPayableId: accountsPayable.id, proformaId, accountsReceivableId});
        } else if (typeQuotation === TypeQuotationE.GENERAL) {
            if (advance && totalPaid >= advance) {
                const purchaseOrder = await this.purchaseOrdersRepository.findOne({
                    where: {
                        quotationId,
                        providerId: proforma.providerId,
                    }
                });

                if (!purchaseOrder)
                    return this.responseService.notFound("No se ha encontrado la orden de compra");

                await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {accountPayableId: accountsPayable.id, proformaId, accountsReceivableId});

            }
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

    async findAccountPayable(proformaId: number) {
        const findProformaAccount = await this.proformaRepository.findOne({
            where: {
                id: proformaId
            },
            include: [{
                relation: "accountPayable",
                scope: {include: [{relation: "accountPayableHistories"}]}
            }]
        })
        return findProformaAccount
    }
    async findProviderBrand(proforma: Proforma): Promise<boolean> {
        const {quotationId, providerId, brandId} = proforma
        const findProviderBrand = await this.proformaRepository.findOne({
            where: {
                quotationId,
                providerId,
                brandId,
            }
        })
        return findProviderBrand ? true : false
    }

    async findProviderBrandUpdate(id: number, proforma: Proforma): Promise<boolean> {
        const {projectId, providerId, brandId} = proforma
        const findProviderBrand = await this.proformaRepository.findOne({
            where: {
                id: {neq: id},
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

    async accountPayableUpdate(id: number | undefined, proforma: Proforma) {
        if (id) {
            let newCurrency: ExchangeRateQuotationE
            if (proforma.currency === ProformaCurrencyE.USD) newCurrency = ExchangeRateQuotationE.USD
            else if (proforma.currency === ProformaCurrencyE.PESO_MEXICANO) newCurrency = ExchangeRateQuotationE.MXN
            else newCurrency = ExchangeRateQuotationE.EUR
            await this.accountPayableRepository.updateById(id, {currency: newCurrency, total: proforma.proformaAmount})
        }

    }
}
