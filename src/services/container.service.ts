import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {HttpErrors, Response, RestBindings} from '@loopback/rest';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import fs from "fs/promises";
import path from 'path';
import {ContainerStatus} from '../enums';
import {Docs, PurchaseOrdersContainer, UpdateContainer, UpdateContainerProducts} from '../interface';
import {schemaCreateContainer, schemaUpdateContainer, schemaUpdateContainerProduct} from '../joi.validation.ts/container.validation';
import {ResponseServiceBindings, STORAGE_DIRECTORY} from '../keys';
import {Container, ContainerCreate, Document, PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {ContainerRepository, DocumentRepository, PurchaseOrdersRepository, QuotationProductsRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ContainerService {
    constructor(
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @inject(STORAGE_DIRECTORY) private storageDirectory: string,
        @inject(RestBindings.Http.RESPONSE)
        public res: Response,
    ) { }

    async create(container: Omit<ContainerCreate, 'id'>,) {
        try {
            await this.validateBodyCustomer(container);
            const {docs, ...body} = container
            const containerRes = await this.containerRepository.create({...body});
            await this.createDocument(containerRes!.id, docs);
            return containerRes;
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async createCartaTraduccion(id: number) {
        const container = await this.containerRepository.findById(id, {
            include: [
                {
                    relation: 'purchaseOrders',
                    scope: {
                        include: [
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    include: [
                                        {
                                            relation: 'provider'
                                        },
                                        {
                                            relation: 'brand'
                                        },
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
                                            relation: 'product',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'line'
                                                    },
                                                    {
                                                        relation: 'document'
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Carta traducción');

        const columns = [
            {header: 'Código', key: 'codigo', width: 20},
            {header: 'Número de factura', key: 'numeroFactura', width: 20},
            {header: 'Id de orden de compra', key: 'ordenCompraId', width: 20},
            {header: 'Proveedor', key: 'proveedor', width: 20},
            {header: 'Marca', key: 'marca', width: 20},
            {header: 'Cliente', key: 'cliente', width: 20},
            {header: 'Linea', key: 'linea', width: 20},
            {header: 'Modelo', key: 'modelo', width: 20},
            {header: 'Cantidad', key: 'cantidad', width: 20},
            {header: 'Precio unitario Euros', key: 'precioUnitarioEuros', width: 20},
            {header: 'Precio total', key: 'precioTotal', width: 20},
            {header: 'Fotografía', key: 'fotografia', width: 20},
            {header: 'Descripción', key: 'descripcion', width: 20},
            {header: 'Peso neto', key: 'pesoNeto', width: 20},
            {header: 'Peso bruto', key: 'pesoBruto', width: 20},
            {header: 'País de origen', key: 'paisOrigen', width: 20},
        ];
        const startRow = 2;
        worksheet.getRow(startRow).values = columns.map(column => column.header);
        worksheet.columns = columns;

        worksheet.mergeCells('A1:P1');
        worksheet.getCell('A1').value = 'Carta traducción';
        worksheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};

        for (let index = 0; index < container?.purchaseOrders?.length; index++) {
            const element = container?.purchaseOrders[index];
            for (let index = 0; index < element?.quotationProducts?.length; index++) {
                const elementProduct = element?.quotationProducts[index];
                const {product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, } = elementProduct;
                const {line, name} = product;
                const descriptionParts = [
                    line?.name,
                    name,
                    mainMaterial,
                    mainFinish,
                    secondaryMaterial,
                    secondaryFinishing
                ];
                const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                let file = ''
                try {
                    const fileName = elementProduct?.product?.document?.fileURL?.split('/').pop();
                    if (fileName) {
                        const localFile = this.validateFileName(fileName);
                        console.log(localFile)
                        file = `data:image/svg+xml;base64,${await fs.readFile(localFile, {encoding: 'base64'})}`
                    }
                } catch (error) {

                }
                const newRow = worksheet.addRow({
                    codigo: elementProduct?.SKU,
                    numeroFactura: elementProduct?.invoiceNumber,
                    ordenCompraId: element.id,
                    proveedor: elementProduct?.provider?.name,
                    marca: elementProduct?.brand?.brandName,
                    cliente: elementProduct?.quotation?.customer?.name,
                    linea: elementProduct?.product?.line?.name,
                    modelo: elementProduct?.model,
                    cantidad: elementProduct?.quantity,
                    precioUnitarioEuros: elementProduct?.originCost,
                    precioTotal: elementProduct?.price,
                    fotografia: file,
                    descripcion: description,
                    pesoNeto: elementProduct?.netWeight,
                    pesoBruto: elementProduct?.grossWeight,
                    paisOrigen: elementProduct?.product?.countryOrigin,
                });

            }

        }
        const buffer = await workbook.xlsx.writeBuffer();
        this.res.setHeader('Content-Disposition', `attachment; filename=archivo-carta-traduccion.xlsx`);
        this.res.setHeader('Content-Type', 'application/xlsx');
        return this.res.status(200).send(buffer)
    }

    async createCartaPorte(id: number) {
        const container = await this.containerRepository.findById(id, {
            include: [
                {
                    relation: 'purchaseOrders',
                    scope: {
                        include: [
                            {
                                relation: 'quotationProducts',
                                scope: {
                                    include: [
                                        {
                                            relation: 'provider'
                                        },
                                        {
                                            relation: 'brand'
                                        },
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
                                            relation: 'product',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'line'
                                                    },
                                                    {
                                                        relation: 'document'
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();

        for (let index = 0; index < container?.purchaseOrders?.length; index++) {
            const element = container?.purchaseOrders[index];
            const worksheet = workbook.addWorksheet('Carta traducción');

            worksheet.mergeCells('A4:I4');
            worksheet.getCell('A4').value = 'DATOS DEL CLIENTE';
            worksheet.getCell('A4').alignment = {vertical: 'middle', horizontal: 'center'};

            worksheet.getColumn(1).width = 30;
            worksheet.getColumn(2).width = 30;
            worksheet.getColumn(3).width = 30;
            worksheet.getColumn(4).width = 30;
            worksheet.getColumn(5).width = 30;
            worksheet.getColumn(6).width = 30;
            worksheet.getColumn(7).width = 30;
            worksheet.getColumn(8).width = 30;
            worksheet.getColumn(9).width = 30;

            worksheet.getCell('A7').value = 'RFC:';
            worksheet.getCell('A7').font = {bold: true};
            worksheet.getCell('A8').value = 'RAZÓN SOCIAL:';
            worksheet.getCell('A8').font = {bold: true};
            worksheet.getCell('A9').value = 'DOMICILIO FISCAL:';
            worksheet.getCell('A9').font = {bold: true};
            worksheet.getCell('A10').value = 'RÉGIMEN FISCAL:';
            worksheet.getCell('A10').font = {bold: true};
            worksheet.getCell('A11').value = 'CÓDIGO POSTAL:';
            worksheet.getCell('A11').font = {bold: true};
            worksheet.getCell('A12').value = 'CLAVE DEL PAÍS DE ORIGEN:';
            worksheet.getCell('A12').font = {bold: true};

            worksheet.mergeCells('A15:I15');
            worksheet.getCell('A15').value = 'DIRECCIÓN DE ENTREGA';
            worksheet.getCell('A15').alignment = {vertical: 'middle', horizontal: 'center'};

            worksheet.getCell('A18').value = 'NOMBRE DEL DESTINATARIO:';
            worksheet.getCell('A18').font = {bold: true};
            worksheet.getCell('A19').value = 'DOMICILIO DE ENTREGA:';
            worksheet.getCell('A19').font = {bold: true};
            worksheet.getCell('A20').value = 'HORARIO:';
            worksheet.getCell('A20').font = {bold: true};
            worksheet.getCell('A21').value = 'CONTACTO:';
            worksheet.getCell('A21').font = {bold: true};
            worksheet.getCell('A22').value = 'TELEFONO:';
            worksheet.getCell('A22').font = {bold: true};
            worksheet.getCell('A23').value = 'REFERENCIA INTERNA:';
            worksheet.getCell('A23').font = {bold: true};

            worksheet.mergeCells('A26:I26');
            worksheet.getCell('A26').value = 'DATOS DEL CONTENEDOR';
            worksheet.getCell('A26').alignment = {vertical: 'middle', horizontal: 'center'};

            worksheet.getCell('A29').value = 'PEDIMIENTO:';
            worksheet.getCell('A29').font = {bold: true};
            worksheet.getCell('A30').value = 'CONTENEDOR:';
            worksheet.getCell('A30').font = {bold: true};
            worksheet.getCell('A31').value = 'PESO BRUTO:';
            worksheet.getCell('A31').font = {bold: true};
            worksheet.getCell('A32').value = 'NÚMERO DE BULTOS:';
            worksheet.getCell('A32').font = {bold: true};
            worksheet.getCell('A33').value = 'MEDIDAS:';
            worksheet.getCell('A33').font = {bold: true};

            const columns = [
                {header: 'Número de factura', key: 'noFactura', width: 20},
                {header: 'Orden', key: 'orden', width: 20},
                {header: 'Proveedor', key: 'proveedor', width: 20},
                {header: 'Marca', key: 'marca', width: 20},
                {header: 'Linea', key: 'linea', width: 20},
                {header: 'Modelo', key: 'modelo', width: 20},
                {header: 'Cantidad', key: 'cantidad', width: 20},
                {header: 'Peso bruto', key: 'pesoBruto', width: 20},
                {header: 'Clave del SAT', key: 'claveSAT', width: 20},
            ];
            const startRow = 36;
            worksheet.getRow(startRow).values = columns.map(column => column.header);
            for (let index = 0; index < element?.quotationProducts?.length; index++) {
                const elementProduct = element?.quotationProducts[index];

                worksheet.addRow([
                    elementProduct?.invoiceNumber,
                    element.id,
                    elementProduct?.provider?.name,
                    elementProduct?.brand?.brandName,
                    elementProduct?.product?.line?.name,
                    elementProduct?.model,
                    elementProduct?.quantity,
                    elementProduct?.grossWeight,
                    elementProduct?.product?.CATSAT,
                ]);
            }
        }
        // const buffer = await workbook.xlsx.writeBuffer();
        // this.res.setHeader('Content-Disposition', `attachment; filename=archivo-carta-porte.xlsx`);
        // this.res.setHeader('Content-Type', 'application/xlsx');
        // return this.res.status(200).send(buffer)
        const filename = `SEemisor`;
        // Guardar el archivo
        await workbook.xlsx.writeFile(`.sandbox/${filename}.xlsx`);
    }

    private validateFileName(fileName: string) {
        const resolved = path.resolve(this.storageDirectory, fileName);
        if (resolved.startsWith(this.storageDirectory)) return resolved;
        throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
    }

    async updateById(id: number, data: UpdateContainer,) {
        try {
            await this.validateBodyUpdate(data);
            const container = await this.containerRepository.findOne({where: {id}});
            if (!container)
                throw this.responseService.badRequest("El contenedor no existe.")
            const {docs, purchaseOrders, status, ...body} = data;
            const date = await this.calculateArrivalDateAndShippingDate(status);
            await this.containerRepository.updateById(id, {...body, ...date, status});
            await this.calculateArrivalDatePurchaseOrder(id);
            await this.updateDocument(id, docs);
            await this.updateProducts(purchaseOrders);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async updateByIdProducts(id: number, data: UpdateContainerProducts,) {
        await this.validateBodyUpdateProducts(data);
        const container = await this.containerRepository.findOne({where: {id}});
        if (!container)
            throw this.responseService.badRequest("El contenedor no existe.")
        const {purchaseOrders} = data;
        await this.updateProducts(purchaseOrders);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async calculateArrivalDatePurchaseOrder(containerId: number) {
        const include: InclusionFilter[] = [
            {
                relation: 'collection',
                scope: {
                    include: [
                        {
                            relation: 'purchaseOrders',
                        }
                    ]
                }
            }
        ]
        const container = await this.containerRepository.findById(containerId, {include});
        const {ETDDate, ETADate} = container;
        let arrivalDate;
        if (ETADate) {
            arrivalDate = dayjs(ETADate).add(10, 'days').toDate()
        }
        else if (ETDDate) {
            arrivalDate = dayjs(ETDDate).add(31, 'days').toDate()
        }
        const {collection} = container;
        if (collection && collection?.purchaseOrders) {
            const {purchaseOrders} = collection;
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                if (arrivalDate) {
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
                const {productionEndDate, productionRealEndDate} = element;
                if (productionRealEndDate) {
                    const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
                if (productionEndDate) {
                    const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                    await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                    return;
                }
            }
        }
    }

    calculateArrivalDateAndShippingDate(status: ContainerStatus) {
        if (status === ContainerStatus.EN_TRANSITO)
            return {arrivalDate: dayjs().toDate()}
        if (status === ContainerStatus.ENTREGADO)
            return {shippingDate: dayjs().toDate()}
    }

    async updateProducts(purchaseOrders: PurchaseOrdersContainer[]) {
        for (let index = 0; index < purchaseOrders?.length; index++) {
            const {products} = purchaseOrders[index];
            for (let index = 0; index < products?.length; index++) {
                const {id, ...data} = products[index];
                await this.quotationProductsRepository.updateById(id, {...data})
            }
        }
    }

    async find(filter?: Filter<Container>,) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'collection',
                    scope: {
                        include: [
                            {
                                relation: 'purchaseOrders',
                                scope: {
                                    include: [
                                        {
                                            relation: 'proforma',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'quotationProducts',
                                                        scope: {
                                                            include: [
                                                                {
                                                                    relation: 'product',
                                                                    scope: {
                                                                        include: [
                                                                            {
                                                                                relation: 'document'
                                                                            },
                                                                            {
                                                                                relation: 'line'
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            ],
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
            const containers = await this.containerRepository.find(filter);
            return containers.map(value => {
                const {id, containerNumber, collection, arrivalDate, status, shippingDate} = value;
                let quantity = 0;
                for (let index = 0; index < collection?.purchaseOrders.length; index++) {
                    const element = collection?.purchaseOrders[index];
                    const {proforma} = element;
                    const {quotationProducts} = proforma;
                    quantity += quotationProducts?.length ?? 0;
                }
                return {
                    id,
                    containerNumber,
                    quantity,
                    shippingDate,
                    arrivalDate,
                    status
                }
            })

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async getContainerEntry() {
        try {
            const containers = await this.containerRepository.find({
                where: {
                    status: ContainerStatus.ENTREGADO
                },
                include: [
                    {
                        relation: 'purchaseOrders',
                        scope: {
                            include: [
                                {
                                    relation: 'quotationProducts',
                                    scope: {
                                        include: [
                                            {
                                                relation: 'product',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'document'
                                                        },
                                                        {
                                                            relation: 'line'
                                                        }
                                                    ]
                                                }
                                            }
                                        ],
                                    }
                                }
                            ]
                        }
                    }
                ]
            });
            return containers?.map(value => {
                const {id, containerNumber, purchaseOrders, arrivalDate, status, shippingDate} = value;
                return {
                    id,
                    containerNumber,
                    status,
                    purchaseOrders: purchaseOrders?.map(value => {
                        const {id, quotationProducts} = value;
                        return {
                            id,
                            quotationProducts: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                                const {id: productId, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, } = value;
                                const {document, line, name} = product;
                                const descriptionParts = [
                                    line?.name,
                                    name,
                                    mainMaterial,
                                    mainFinish,
                                    secondaryMaterial,
                                    secondaryFinishing
                                ];
                                const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                                return {
                                    id: productId,
                                    image: document?.fileURL,
                                    description,
                                }
                            })
                        }
                    })
                }
            })

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async findById(id: number, filter?: FilterExcludingWhere<Container>) {
        try {
            const include: InclusionFilter[] = [
                {
                    relation: 'purchaseOrders',
                    scope: {
                        include: [
                            {
                                relation: 'proforma',
                                scope: {
                                    include: [
                                        {
                                            relation: 'quotationProducts',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'product',
                                                        scope: {
                                                            include: [
                                                                {
                                                                    relation: 'document'
                                                                },
                                                                {
                                                                    relation: 'line'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ],
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    relation: 'documents'
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
            const container = await this.containerRepository.findById(id, filter);
            const {pedimento, containerNumber, grossWeight, numberBoxes, measures, status, arrivalDate, shippingDate, ETDDate, ETADate, invoiceNumber, documents, purchaseOrders} = container;
            return {
                pedimento,
                containerNumber,
                grossWeight,
                numberBoxes,
                measures,
                status,
                invoiceNumber,
                arrivalDate: arrivalDate ?? 'Pendiente',
                shippingDate: shippingDate ?? 'Pendiente',
                ETDDate: ETDDate ?? 'Pendiente',
                ETADate: ETADate ?? 'Pendiente',
                docs: documents?.map(value => {
                    const {id, fileURL, name, extension} = value;
                    return {
                        id,
                        fileURL,
                        name, extension
                    }
                }),
                purchaseOrders: purchaseOrders ? purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                    const {id: purchaseOrderid, proforma} = value;
                    const {quotationProducts} = proforma;
                    return {
                        id: purchaseOrderid,
                        products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                            const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, invoiceNumber, grossWeight, netWeight, numberBoxes, NOMS, descriptionPedimiento, quantity} = value;
                            const {document, line, name} = product;
                            const descriptionParts = [
                                line?.name,
                                name,
                                mainMaterial,
                                mainFinish,
                                secondaryMaterial,
                                secondaryFinishing
                            ];
                            const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                            return {
                                id: productId,
                                SKU,
                                image: document?.fileURL,
                                description,
                                descriptionPedimiento,
                                invoiceNumber,
                                grossWeight,
                                netWeight,
                                numberBoxes,
                                NOMS,
                                quantity
                            }
                        })
                    }
                }) : [],
            }
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async validateContainerById(id: number) {
        const container = await this.containerRepository.findOne({where: {id}});
        if (!container)
            throw this.responseService.badRequest("El contenedor no existe.");

        return container;
    }


    async validateBodyCustomer(customer: ContainerCreate) {
        try {
            await schemaCreateContainer.validateAsync(customer);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyUpdate(data: UpdateContainer,) {
        try {
            await schemaUpdateContainer.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }
    async validateBodyUpdateProducts(data: UpdateContainerProducts,) {
        try {
            await schemaUpdateContainerProduct.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async createDocument(containerId?: number, documents?: Document[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.containerRepository.documents(containerId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }

    async updateDocument(containerId?: number, documents?: Docs[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.containerRepository.documents(containerId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }
}
