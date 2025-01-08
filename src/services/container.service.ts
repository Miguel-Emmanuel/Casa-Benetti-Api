import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, InclusionFilter, repository} from '@loopback/repository';
import {HttpErrors, Response, RestBindings} from '@loopback/rest';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import {ContainerStatus, PurchaseOrdersStatus, QuotationProductStatusE} from '../enums';
import {Docs, PurchaseOrdersContainer, UpdateContainer, UpdateContainerProducts} from '../interface';
import {schemaCreateContainer, schemaUpdateContainer, schemaUpdateContainerProduct} from '../joi.validation.ts/container.validation';
import {ResponseServiceBindings, STORAGE_DIRECTORY} from '../keys';
import {Container, ContainerCreate, Document, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {ContainerRepository, DocumentRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository} from '../repositories';
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
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
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

    async getPurchaseOrdersForContainer() {
        try {
            let purchaseOrders = await this.purchaseOrdersRepository.find({
                where: {
                    status: PurchaseOrdersStatus.TRANSITO_INTERNACIONAL,
                    containerId: undefined
                },
                include: [
                    {
                        relation: "project",
                    },
                    {
                        relation: "quotationProducts"
                    }
                ]
            });

            purchaseOrders = purchaseOrders.filter(pO => !pO.containerId);

            return purchaseOrders.map(pO => {
                return {
                    id: pO.id,
                    projectId: pO?.project?.projectId,
                    products: pO?.quotationProducts?.map(qProducts => {
                        return {
                            id: qProducts.id,
                            SKU: qProducts.SKU,
                            mainFinishImage: qProducts.mainFinishImage,
                            description: qProducts?.descriptionPedimiento
                        }
                    })
                }
            }) ?? [];

        } catch (error) {
            return this.responseService.internalServerError(error?.message ? error.message : error);
        }
    }

    async createCartaTraduccion(id: number) {
        try {
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
                    },
                    {
                        relation: 'collection',
                        scope: {
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

            const purchaseOrders = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
            console.log(purchaseOrders.length)
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
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
                    let file = null
                    try {
                        const fileName = elementProduct?.product?.document?.fileURL?.split('/').pop();
                        if (fileName) {
                            const localFile = this.validateFileName(fileName);
                            await fs.access(localFile)
                            file = localFile
                        }
                    } catch (error) {
                    }
                    // Primero, agrega la imagen al workbook
                    let imageId = null
                    if (file) {
                        const extension = path.extname(file).slice(1);
                        imageId = workbook.addImage({
                            filename: file, // 'file' es tu imagen en base64
                            extension: extension === 'png' ? 'png' : 'jpeg' // Cambia la extensión según el tipo de imagen
                        });
                    }
                    console.log('Product: ', index)
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
                        fotografia: '',
                        descripcion: description,
                        pesoNeto: elementProduct?.netWeight,
                        pesoBruto: elementProduct?.grossWeight,
                        paisOrigen: elementProduct?.product?.countryOrigin,
                    });
                    if (imageId) {
                        console.log('Inside image id: ', file)
                        const imageWidth = 60; // ejemplo de ancho en píxeles
                        const imageHeight = 60;
                        const widthInPoints = imageWidth / 0.75;
                        const heightInPoints = imageHeight / 0.95;
                        worksheet.getColumn(13).width = widthInPoints / 8.43; // Ajustar el ancho de la columna
                        worksheet.getRow(newRow.number).height = heightInPoints;
                        worksheet.addImage(imageId, {
                            tl: {col: 11, row: newRow.number - 1}, // Comienza en la celda de la columna 'fotografia'
                            ext: {width: imageWidth, height: imageHeight} // Ajusta el tamaño según necesites
                        });
                    }
                }

            }
            const buffer = await workbook.xlsx.writeBuffer();
            this.res.setHeader('Content-Disposition', `attachment; filename=archivo-carta-traduccion.xlsx`);
            this.res.setHeader('Content-Type', 'application/xlsx');
            return this.res.status(200).send(buffer)

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async createCartaPorte(id: number) {
        try {
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
                    },
                    {
                        relation: 'collection',
                        scope: {
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
                        }
                    }
                ]
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Carta porte');

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
            worksheet.getCell('B7').value = 'BCA150508BCA';
            worksheet.getCell('B7').alignment = {horizontal: 'left'};


            worksheet.getCell('A8').value = 'RAZÓN SOCIAL:';
            worksheet.getCell('A8').font = {bold: true};
            worksheet.getCell('B8').value = 'BENETTI CASA S. DE RL DE CV';
            worksheet.getCell('B8').alignment = {horizontal: 'left'};

            worksheet.getCell('A9').value = 'DOMICILIO FISCAL:';
            worksheet.getCell('A9').font = {bold: true};
            worksheet.getCell('B9').value = 'Av. Prolongación Bosques Ext.1813, Local 153-154 Lomas de Vista Hermosa, C.P. 05100 Cuajimalpa de Morelos';
            worksheet.getCell('B9').alignment = {horizontal: 'left'};

            worksheet.getCell('A10').value = 'RÉGIMEN FISCAL:';
            worksheet.getCell('A10').font = {bold: true};
            worksheet.getCell('B10').value = 'Persona Moral';
            worksheet.getCell('B10').alignment = {horizontal: 'left'};

            worksheet.getCell('A11').value = 'CÓDIGO POSTAL:';
            worksheet.getCell('A11').font = {bold: true};
            worksheet.getCell('B11').value = '05100';
            worksheet.getCell('B11').alignment = {horizontal: 'left'};

            worksheet.getCell('A12').value = 'CLAVE DEL PAÍS DE ORIGEN:';
            worksheet.getCell('A12').font = {bold: true};
            worksheet.getCell('B12').value = 'MEX';
            worksheet.getCell('B12').alignment = {horizontal: 'left'};

            worksheet.mergeCells('A15:I15');
            worksheet.getCell('A15').value = 'DIRECCIÓN DE ENTREGA';
            worksheet.getCell('A15').alignment = {vertical: 'middle', horizontal: 'center'};

            worksheet.getCell('A18').value = 'NOMBRE DEL DESTINATARIO:';
            worksheet.getCell('A18').font = {bold: true};
            worksheet.getCell('B18').value = 'BENETTI CASA BODEGA CUAJIMALPA';
            worksheet.getCell('B18').alignment = {horizontal: 'left'};

            worksheet.getCell('A19').value = 'DOMICILIO DE ENTREGA:';
            worksheet.getCell('A19').font = {bold: true};
            worksheet.getCell('B19').value = 'Cuajimalpa Av. Juárez No. 49 Cuajimalpa Ciudad de México C.P.05000';
            worksheet.getCell('B19').alignment = {horizontal: 'left'};

            worksheet.getCell('A20').value = 'HORARIO:';
            worksheet.getCell('A20').font = {bold: true};
            worksheet.getCell('B20').value = '21 hrs a 3:00 hrs';
            worksheet.getCell('B20').alignment = {horizontal: 'left'};

            worksheet.getCell('A21').value = 'CONTACTO:';
            worksheet.getCell('A21').font = {bold: true};
            worksheet.getCell('B21').value = 'Javier Hernandez';
            worksheet.getCell('B21').alignment = {horizontal: 'left'};

            worksheet.getCell('A22').value = 'TELEFONO:';
            worksheet.getCell('A22').font = {bold: true};
            worksheet.getCell('B22').value = '5559600322';
            worksheet.getCell('B22').alignment = {horizontal: 'left'};

            worksheet.getCell('A23').value = 'REFERENCIA INTERNA:';
            worksheet.getCell('A23').font = {bold: true};
            worksheet.getCell('B12').value = `CONTENEDOR ${container.id}`;
            worksheet.getCell('B12').alignment = {horizontal: 'left'};

            worksheet.mergeCells('A26:I26');
            worksheet.getCell('A26').value = 'DATOS DEL CONTENEDOR';
            worksheet.getCell('A26').alignment = {vertical: 'middle', horizontal: 'center'};

            worksheet.getCell('A29').value = 'PEDIMIENTO:';
            worksheet.getCell('A29').font = {bold: true};
            worksheet.getCell('B29').value = `${container.pedimento}`;
            worksheet.getCell('B29').alignment = {horizontal: 'left'};

            worksheet.getCell('A30').value = 'CONTENEDOR:';
            worksheet.getCell('A30').font = {bold: true};
            worksheet.getCell('B30').value = `${container.containerNumber}`;
            worksheet.getCell('B30').alignment = {horizontal: 'left'};

            worksheet.getCell('A31').value = 'PESO BRUTO:';
            worksheet.getCell('A31').font = {bold: true};
            worksheet.getCell('B31').value = `${container.grossWeight}`;
            worksheet.getCell('B31').alignment = {horizontal: 'left'};

            worksheet.getCell('A32').value = 'NÚMERO DE BULTOS:';
            worksheet.getCell('A32').font = {bold: true};
            worksheet.getCell('B32').value = `${container.numberBoxes}`;
            worksheet.getCell('B32').alignment = {horizontal: 'left'};

            worksheet.getCell('A33').value = 'MEDIDAS:';
            worksheet.getCell('A33').font = {bold: true};
            worksheet.getCell('B33').value = `${container.measures}`;
            worksheet.getCell('B33').alignment = {horizontal: 'left'};

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
            const purchaseOrders = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
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
            const buffer = await workbook.xlsx.writeBuffer();
            this.res.setHeader('Content-Disposition', `attachment; filename=archivo-carta-porte.xlsx`);
            this.res.setHeader('Content-Type', 'application/xlsx');
            return this.res.status(200).send(buffer)

        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async createArchivoEtiquetas(id: number) {
        try {
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
                    },
                    {
                        relation: 'collection',
                        scope: {
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
                        }
                    }
                ]
            });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Archivo etiqueta');

            const rowOffset = 25; // Desplazamiento de filas para cada bloque de etiqueta
            const purchaseOrders = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
            for (let index = 0; index < purchaseOrders.length; index++) {
                const element = purchaseOrders[index];
                for (let index = 0; index < element?.quotationProducts?.length; index++) {
                    const elementProduct = element?.quotationProducts[index];
                    const {id, product, numberBoxes, SKU, brand, model} = elementProduct;
                    const {name, countryOrigin} = product;
                    let iterations = numberBoxes ? numberBoxes === 0 ? 1 : numberBoxes : 1;
                    for (let i = 0; i < iterations; i++) {
                        const startRow = i * rowOffset + 1;
                        // Limpiar el rango de celdas antes de combinar
                        worksheet.getCell(`A${startRow}`).value = '';
                        worksheet.getCell(`A${startRow + 5}`).value = '';
                        worksheet.getCell(`A${startRow + 12}`).value = '';
                        worksheet.getCell(`A${startRow + 20}`).value = '';

                        // Unir celdas para la cabecera
                        if (!worksheet.getCell(`A${startRow}`).isMerged) {
                            worksheet.mergeCells(`A${startRow}:E${startRow + 3}`);
                        }
                        worksheet.getCell(`A${startRow}`).value = 'BENETTI CASA, S DE RL DE CV';
                        worksheet.getCell(`A${startRow}`).alignment = {vertical: 'middle', horizontal: 'center'};

                        // Unir celdas para la dirección
                        if (!worksheet.getCell(`A${startRow + 5}`).isMerged) {
                            worksheet.mergeCells(`A${startRow + 5}:E${startRow + 9}`);
                        }
                        worksheet.getCell(`A${startRow + 5}`).value = 'AV. PROLONGACIÓN BOSQUES #1813 L-153-154, LOMAS DE VISTA HERMOSA CUAJIMALPA DE MORELOS, CP 05100, MÉXICO, CIUDAD DE MÉXICO.';
                        worksheet.getCell(`A${startRow + 5}`).alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};

                        // Ajustar el ancho de las columnas
                        worksheet.getColumn(1).width = 20;
                        worksheet.getColumn(2).width = 20;

                        // Asignar valores para las etiquetas SKU, Producto, etc.
                        worksheet.getCell(`A${startRow + 12}`).value = 'SKU:';
                        worksheet.getCell(`A${startRow + 12}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 12}`).value = SKU;
                        worksheet.getCell(`B${startRow + 12}`).alignment = {horizontal: 'left'};

                        worksheet.getCell(`A${startRow + 13}`).value = 'Producto:';
                        worksheet.getCell(`A${startRow + 13}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 13}`).value = name;
                        worksheet.getCell(`B${startRow + 13}`).alignment = {horizontal: 'left'};

                        worksheet.getCell(`A${startRow + 14}`).value = 'Hecho en:';
                        worksheet.getCell(`A${startRow + 14}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 14}`).value = countryOrigin;
                        worksheet.getCell(`B${startRow + 14}`).alignment = {horizontal: 'left'};

                        worksheet.getCell(`A${startRow + 15}`).value = 'Marca:';
                        worksheet.getCell(`A${startRow + 15}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 15}`).value = brand?.brandName;
                        worksheet.getCell(`B${startRow + 15}`).alignment = {horizontal: 'left'};

                        worksheet.getCell(`A${startRow + 16}`).value = 'Modelo:';
                        worksheet.getCell(`A${startRow + 16}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 16}`).value = model;
                        worksheet.getCell(`B${startRow + 16}`).alignment = {horizontal: 'left'};

                        worksheet.getCell(`A${startRow + 17}`).value = 'Contenido:';
                        worksheet.getCell(`A${startRow + 17}`).font = {bold: true};
                        worksheet.getCell(`B${startRow + 17}`).value = '1 pieza';
                        worksheet.getCell(`B${startRow + 17}`).alignment = {horizontal: 'left'};

                        // Unir celdas y asignar el texto final con subrayado
                        if (!worksheet.getCell(`A${startRow + 20}`).isMerged) {
                            worksheet.mergeCells(`A${startRow + 20}:E${startRow + 20}`);
                        }
                        worksheet.getCell(`A${startRow + 20}`).value = 'MOBILIARIO INSTALADO POR PERSONAL ESPECIALIZADO DE LA EMPRESA IMPORTADORA';
                        worksheet.getCell(`A${startRow + 20}`).alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
                        worksheet.getCell(`A${startRow + 20}`).font = {underline: true};
                    }
                }

            }
            const buffer = await workbook.xlsx.writeBuffer();
            this.res.setHeader('Content-Disposition', `attachment; filename=archivo-etiqueta.xlsx`);
            this.res.setHeader('Content-Type', 'application/xlsx');
            return this.res.status(200).send(buffer)
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error)
        }
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
            const {docs, purchaseOrders, status, newPurchaseOrders, ...body} = data;
            const date = await this.calculateArrivalDateAndShippingDate(status);
            await this.containerRepository.updateById(id, {...body, ...date, status});
            await this.calculateArrivalDatePurchaseOrder(id);
            await this.setStatusPurchaseOrder(id, status);
            await this.updateDocument(id, docs);
            await this.updateProducts(purchaseOrders);
            await this.addNewPurchaseOrdersToContainer(newPurchaseOrders, id);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            console.log(error)
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async addNewPurchaseOrdersToContainer(newPurchaseOrders: {id: number}[], containerId: number) {
        for (let index = 0; index < newPurchaseOrders?.length; index++) {
            await this.purchaseOrdersRepository.updateById(newPurchaseOrders[index].id, {containerId})
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


    async setStatusPurchaseOrder(containerId: number, status: ContainerStatus) {
        const include: InclusionFilter[] = [
            {
                relation: 'purchaseOrders',
            },
            {
                relation: 'collection',
                scope: {
                    include: [
                        {
                            relation: 'purchaseOrders'
                        }
                    ]
                }
            }
        ]
        const container = await this.containerRepository.findById(containerId, {include});
        const purchaseOrdersFor = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
        for (let index = 0; index < purchaseOrdersFor.length; index++) {
            const element = purchaseOrdersFor[index];
            if (status === ContainerStatus.EN_TRANSITO) {
                await this.purchaseOrdersRepository.updateById(element.id, {status: PurchaseOrdersStatus.TRANSITO_INTERNACIONAL})
                await this.quotationProductsRepository.updateAll({purchaseOrdersId: element.id}, {status: QuotationProductStatusE.TRANSITO_INTERNACIONAL})
            }
            if (status === ContainerStatus.ENTREGADO) {
                await this.purchaseOrdersRepository.updateById(element.id, {status: PurchaseOrdersStatus.PROCESO_ADUANA})
                await this.quotationProductsRepository.updateAll({purchaseOrdersId: element.id}, {status: QuotationProductStatusE.PROCESO_ADUANA})
            }
        }
    }

    async calculateArrivalDatePurchaseOrder(containerId: number) {
        const include: InclusionFilter[] = [
            {
                relation: 'purchaseOrders',
            },
            {
                relation: 'collection',
                scope: {
                    include: [
                        {
                            relation: 'purchaseOrders'
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
            await this.containerRepository.updateById(containerId, {arrivalDateWarehouse: arrivalDate})

        }
        else if (ETDDate) {
            arrivalDate = dayjs(ETDDate).add(31, 'days').toDate()
            await this.containerRepository.updateById(containerId, {arrivalDateWarehouse: arrivalDate})
        }

        const purchaseOrdersFor = [...container?.purchaseOrders ?? [], ...container?.collection?.purchaseOrders ?? []];
        console.log('purchaseOrdersFor: ', purchaseOrdersFor)
        for (let index = 0; index < purchaseOrdersFor.length; index++) {
            const element = purchaseOrdersFor[index];
            console.log('orden de compra id: ', element.id)
            if (arrivalDate) {
                await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                continue;
            }
            const {productionEndDate, productionRealEndDate} = element;
            if (productionRealEndDate) {
                const arrivalDate = dayjs(productionRealEndDate).add(53, 'days').toDate()
                await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                continue;
            }
            if (productionEndDate) {
                const arrivalDate = dayjs(productionEndDate).add(53, 'days').toDate()
                await this.purchaseOrdersRepository.updateById(element.id, {arrivalDate})
                continue;
            }
        }
    }

    calculateArrivalDateAndShippingDate(status: ContainerStatus) {
        if (status === ContainerStatus.EN_TRANSITO)
            return {shippingDate: dayjs().toDate()}
        if (status === ContainerStatus.ENTREGADO)
            return {arrivalDate: dayjs().toDate()}
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
                },
                {
                    relation: 'collection',
                    scope: {
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
                const {id, containerNumber, arrivalDate, status, shippingDate, purchaseOrders, createdAt, collection, ETADate, ETDDate, arrivalDateWarehouse} = value;
                let quantity = 0;
                if (collection) {
                    const {purchaseOrders} = collection;
                    for (let index = 0; index < purchaseOrders?.length; index++) {
                        const element = purchaseOrders[index];
                        const {quotationProducts} = element;
                        quantity += quotationProducts?.length ?? 0;
                    }
                }
                for (let index = 0; index < purchaseOrders?.length; index++) {
                    const element = purchaseOrders[index];
                    const {quotationProducts} = element;
                    quantity += quotationProducts?.length ?? 0;
                }
                return {
                    id,
                    containerNumber,
                    quantity,
                    shippingDate,
                    arrivalDate,
                    status,
                    createdAt,
                    ETADate,
                    ETDDate,
                    arrivalDateWarehouse: arrivalDateWarehouse ?? null
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
                },
                {
                    relation: 'documents'
                },
                {
                    relation: 'collection',
                    scope: {
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
                                        },
                                        {
                                            relation: 'project'
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



            const container = await this.containerRepository.findById(id, filter);
            const {pedimento, containerNumber, grossWeight, numberBoxes, measures, status, arrivalDate, shippingDate, ETDDate, ETADate, invoiceNumber, documents, purchaseOrders, collection, createdAt} = container;
            let purchaseOrdersContainers = [...purchaseOrders ?? [], ...collection?.purchaseOrders ?? []]
            let purchaseOrdersContainersWithProjectId = [];

            for (const pO of purchaseOrdersContainers) {
                const getProject = await this.projectRepository.findById(pO?.projectId!, {fields: ["id", "projectId"]});
                purchaseOrdersContainersWithProjectId.push({...pO, projectId: getProject?.projectId})
            }

            return {
                pedimento,
                createdAt,
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
                purchaseOrders: purchaseOrdersContainersWithProjectId ? purchaseOrdersContainersWithProjectId?.map((value: any) => {
                    const {id: purchaseOrderid, proforma, projectId, quotationProducts} = value;

                    const projectIdData = projectId;
                    return {
                        id: purchaseOrderid,
                        projectId: projectIdData ?? null,
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
                                projectId: projectIdData,
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
