import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ConvertCurrencyToEUR, CurrencyE, InventoryMovementsTypeE} from '../enums';
import {InventorieDataI} from '../interface';
import {ResponseServiceBindings} from '../keys';
import {InventoriesRepository, InventoryMovementsRepository, QuotationProductsRepository} from '../repositories';
import {DayExchangeCalculateService} from './day-exchange-calculate';
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
        @service()
        public dayExchangeCalculateService: DayExchangeCalculateService
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
            const {inventories, comment, id: inventoryMovementId, quantity} = inventoryMovements[index];
            const {warehouseId, branchId, quotationProducts, branch, warehouse, stock} = inventories;
            const {id, product, model, originCode, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, assembledProducts, SKU} = quotationProducts;
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
                if (findWarehouse !== -1) {
                    const findProduct = warehouseArray[findWarehouse].products.findIndex(value => value.id === id);
                    if (findProduct !== -1) {
                        const findProductObject = warehouseArray[findWarehouse].products.find(value => value.id === id);
                        if (findProductObject)
                            warehouseArray[findWarehouse].products[findProduct] = {
                                ...findProductObject,
                                stock: stock
                            }
                    } else {

                        warehouseArray[findWarehouse].products.push({
                            id,
                            name,
                            sku: SKU,
                            stock: stock,
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
                            inventoryMovementId,
                            quantity
                        })
                    }
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
                                    stock: stock,
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
                                    inventoryMovementId,
                                    quantity
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
                    const findProduct = showroomArray[findShowroom].products.findIndex(value => value.id === id);
                    if (findProduct !== -1) {
                        const findProductObject = showroomArray[findShowroom].products.find(value => value.id === id);
                        if (findProductObject)
                            showroomArray[findShowroom].products[findProduct] = {
                                ...findProductObject,
                                stock: stock
                            }
                    } else {
                        showroomArray[findShowroom].products.push({
                            id,
                            name,
                            sku: SKU,
                            stock: stock,
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
                            inventoryMovementId,
                            quantity
                        })

                    }
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
                                    stock: stock,
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
                                    inventoryMovementId,
                                    quantity
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
                                                            relation: 'purchaseOrders',
                                                            scope: {
                                                                include: [
                                                                    {
                                                                        relation: 'collection',
                                                                        scope: {
                                                                            include: [
                                                                                {
                                                                                    relation: 'container'
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
            const {product, SKU, quotation, status, model, proforma, originCode, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, id, price, currency, originCost} = quotationProducts;
            const {document, classificationId, lineId, brandId, line, name} = product;
            const {mainProjectManager, project, customer} = quotation;
            const {reference} = project;
            const {purchaseOrders, proformaAmount} = proforma;
            console.log(purchaseOrders)
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
                    },
                    {
                        relation: 'warehouse'
                    },
                    {
                        relation: 'branch'
                    },
                ]
            });

            const calculateCost = await this.calculateCost(currency, originCost)
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
                purchaseOrderId: purchaseOrders?.id ?? null,
                arrivalDate: purchaseOrders?.collection?.container?.arrivalDate ?? null,
                containerNumber: purchaseOrders?.collection?.container?.containerNumber ?? null,
                invoiceNumber: purchaseOrders?.collection?.container?.invoiceNumber ?? null,
                numberBoxes: purchaseOrders?.collection?.container?.numberBoxes ?? null,
                currency,
                originCode,
                description,
                observations: comment,
                cost: price,
                costPerUnity: calculateCost.amount,
                parity: calculateCost.parity,
                inventories: inventoriesNEQ.map(value => {
                    const {branchId, warehouseId, stock, quotationProducts, warehouse, branch} = value;
                    return {
                        branchName: branch?.name,
                        warehouseName: warehouse?.name,
                        stock,
                        cost: (quotationProducts.price * stock),
                        originCost: quotationProducts?.originCost
                    }
                })
            }
        } catch (error) {
            if (error?.message.includes("'proforma' as it is undefined.") || error?.message.includes("'project' as it is undefined."))
                throw this.responseService.badRequest("El producto no se encuentra con alguna proforma/proyecto.")

            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async calculateCost(currency: CurrencyE, originCost: number) {
        if (currency === CurrencyE.PESO_MEXICANO) {
            const {EUR} = await this.dayExchangeCalculateService.getdayExchangeRateMxnTo();
            // return {amount: originCost * ConvertCurrencyToEUR.MXN, parity: ConvertCurrencyToEUR.MXN}
            return {amount: originCost * EUR, parity: EUR}
        }

        if (currency === CurrencyE.USD) {
            const {EUR} = await this.dayExchangeCalculateService.getdayExchangeRateDollarTo();
            // return {amount: originCost * ConvertCurrencyToEUR.USD, parity: ConvertCurrencyToEUR.USD}
            return {amount: originCost * EUR, parity: EUR}
        }
        return {amount: originCost, parity: ConvertCurrencyToEUR.EURO}
    }

}
