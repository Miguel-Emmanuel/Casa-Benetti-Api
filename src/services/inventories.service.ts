import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {InventoryMovementsTypeE} from '../enums';
import {InventorieDataI} from '../interface';
import {InventoryMovementsRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class InventoriesService {
    constructor(
        @repository(InventoryMovementsRepository)
        public inventoryMovementsRepository: InventoryMovementsRepository,
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
            const {inventories, comment} = inventoryMovements[index];
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
                if (findWarehouse) {
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
                        assembledProducts
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
                                    assembledProducts
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
                if (findShowroom) {
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
                        assembledProducts
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
                                    assembledProducts
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

}
