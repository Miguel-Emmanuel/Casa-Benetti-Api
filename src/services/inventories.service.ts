import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ConvertCurrencyToEUR, InventoryMovementsTypeE, ProformaCurrencyE} from '../enums';
import {InventorieDataI} from '../interface';
import {ResponseServiceBindings} from '../keys';
import {InventoriesRepository, InventoryMovementsRepository, QuotationProductsRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class InventoriesService {
    constructor(
        @repository(InventoryMovementsRepository)
        public inventoryMovementsRepository: InventoryMovementsRepository,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(InventoriesRepository)
        public inventoriesRepository: InventoriesRepository,
    ) { }

    async find() {
        const inventoryMovements = await this.inventoryMovementsRepository.find({
            where: {type: InventoryMovementsTypeE.ENTRADA},
            include: [
                {
                    relation: 'inventories',
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
                                    ]
                                }
                            },
                            {
                                relation: 'warehouse'
                            },
                            {
                                relation: 'branch'
                            }
                        ]
                    }
                }
            ]
        });
        const warehouseArray: InventorieDataI[] = [];
        const showroomArray: InventorieDataI[] = [];
        for (let index = 0; index < inventoryMovements.length; index++) {
            const {inventories, comment, id: inventoryMovementId} = inventoryMovements[index];
            const {warehouseId, branchId, quotationProducts, branch, warehouse} = inventories;
            const {id, product, model, originCode, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, assembledProducts, SKU, stock} = quotationProducts;
            const {document, classificationId, lineId, brandId, line, name} = product
            if (warehouseId) {
                const descriptionParts = [
                    line?.name,
                    name,
                    mainMaterial,
                    mainFinish,
                    secondaryMaterial,
                    secondaryFinishing
                ];
                const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                const findWarehouse = warehouseArray.findIndex(value => value.id === warehouseId)
                console.log('findWarehouse: ', findWarehouse)
                if (findWarehouse !== -1) {
                    warehouseArray[findWarehouse].products.push({
                        id,
                        name,
                        sku: SKU,
                        stock,
                        image: document?.fileURL ?? null,
                        classificationId,
                        lineId,
                        brandId,
                        model,
                        originCode,
                        boxes: null,
                        description,
                        observations: comment,
                        assembledProducts,
                        inventoryMovementId
                    })
                } else {
                    warehouseArray.push(
                        {
                            id: warehouseId,
                            name: warehouse?.name,
                            products: [
                                {
                                    id,
                                    name,
                                    sku: SKU,
                                    stock,
                                    image: document?.fileURL ?? null,
                                    classificationId,
                                    lineId,
                                    brandId,
                                    model,
                                    originCode,
                                    boxes: null,
                                    description,
                                    observations: comment,
                                    assembledProducts,
                                    inventoryMovementId
                                }
                            ]
                        }
                    )
                }
            } else if (branchId) {
                const descriptionParts = [
                    line?.name,
                    name,
                    mainMaterial,
                    mainFinish,
                    secondaryMaterial,
                    secondaryFinishing
                ];
                const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                const findShowroom = showroomArray.findIndex(value => value.id === branchId);
                if (findShowroom !== -1) {
                    showroomArray[findShowroom].products.push({
                        id,
                        name,
                        sku: SKU,
                        stock,
                        image: document?.fileURL ?? null,
                        classificationId,
                        lineId,
                        brandId,
                        model,
                        originCode,
                        boxes: null,
                        description,
                        observations: comment,
                        assembledProducts,
                        inventoryMovementId
                    })
                } else {
                    showroomArray.push(
                        {
                            id: branchId,
                            name: branch?.name,
                            products: [
                                {
                                    id,
                                    name,
                                    sku: SKU,
                                    stock,
                                    image: document?.fileURL ?? null,
                                    classificationId,
                                    lineId,
                                    brandId,
                                    model,
                                    originCode,
                                    boxes: null,
                                    description,
                                    observations: comment,
                                    assembledProducts,
                                    inventoryMovementId
                                }
                            ]
                        }
                    )
                }
            }
        }
        return {
            warehouse: warehouseArray,
            showroom: showroomArray,

        };
    }

    async getDetailProduct(inventoryMovementId: number) {
        try {
            const inventoryMovements = await this.inventoryMovementsRepository.findOne({
                where: {id: inventoryMovementId},
                include: [
                    {
                        relation: 'inventories',
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
                                            },
                                            {
                                                relation: 'quotation',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'mainProjectManager'
                                                        },
                                                        {
                                                            relation: 'project'
                                                        },
                                                        {
                                                            relation: 'customer'
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                relation: 'proforma',
                                                scope: {
                                                    include: [
                                                        {
                                                            relation: 'purchaseOrders'
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
            // const quotationProduct = await this.quotationProductsRepository.findOne({
            //     where: {id},
            //     include: [
            //         {
            //             relation: 'product',
            //             scope: {
            //                 include: [
            //                     {
            //                         relation: 'document'
            //                     },
            //                     {
            //                         relation: 'line'
            //                     }
            //                 ]
            //             }
            //         },
            //         {
            //             relation: 'quotation',
            //             scope: {
            //                 include: [
            //                     {
            //                         relation: 'mainProjectManager'
            //                     },
            //                     {
            //                         relation: 'project'
            //                     },
            //                     {
            //                         relation: 'customer'
            //                     }
            //                 ]
            //             }
            //         },
            //         {
            //             relation: 'proforma',
            //             scope: {
            //                 include: [
            //                     {
            //                         relation: 'purchaseOrders'
            //                     }
            //                 ]
            //             }
            //         }
            //     ]
            // });
            if (!inventoryMovements)
                throw this.responseService.badRequest("Producto no encontrado.")

            const {inventories, comment} = inventoryMovements
            const {quotationProducts, id: inventoryId} = inventories;
            const {product, SKU, quotation, status, model, proforma, originCode, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, id, location} = quotationProducts;
            const {document, classificationId, lineId, brandId, line, name} = product;
            const {mainProjectManager, project, customer} = quotation;
            const {reference} = project;
            const {purchaseOrders, currency, proformaAmount} = proforma;
            const descriptionParts = [
                line?.name,
                name,
                mainMaterial,
                mainFinish,
                secondaryMaterial,
                secondaryFinishing
            ];
            const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');

            const inventoriesNEQ = await this.inventoriesRepository.find({
                where: {quotationProductsId: id},
                include: [
                    {
                        relation: 'quotationProducts',
                        scope: {
                        }
                    }
                ]
            });


            return {
                id,
                image: document?.fileURL ?? null,
                SKU,
                mainProjectManager: `${mainProjectManager?.firstName} ${mainProjectManager?.lastName ?? ''}`,
                customerSKU: reference,
                customer: `${customer?.name} ${customer?.lastName ?? ''}`,
                customerId: customer?.id,
                status,
                classificationId,
                lineId,
                brandId,
                model,
                purchaseOrderId: purchaseOrders?.id,
                originCode,
                description,
                observations: comment,
                cost: this.calculateCost(currency, proformaAmount),
                inventories: inventoriesNEQ.map(value => {
                    const {branchId, warehouseId, stock, quotationProducts} = value;
                    return {
                        branchId,
                        warehouseId,
                        stock,
                        cost: (quotationProducts.price * stock)
                    }
                })
            }
        } catch (error) {
            if (error?.message.includes("'proforma' as it is undefined.") || error?.message.includes("'project' as it is undefined."))
                throw this.responseService.badRequest("El producto no se encuentra con alguna proforma/proyecto.")

            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    calculateCost(currency: ProformaCurrencyE, proformaAmount: number) {
        if (currency === ProformaCurrencyE.PESO_MEXICANO)
            return proformaAmount * ConvertCurrencyToEUR.MXN

        if (currency === ProformaCurrencyE.USD)
            return proformaAmount * ConvertCurrencyToEUR.USD

        return proformaAmount;
    }

}
