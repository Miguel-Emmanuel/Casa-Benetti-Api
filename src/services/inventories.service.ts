import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {InventoryMovementsTypeE} from '../enums';
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
                            }
                        ]
                    }
                }
            ]
        });
        const warehouse: any[] = [];
        const branch: any[] = [];
        for (let index = 0; index < inventoryMovements.length; index++) {
            const {inventories, comment} = inventoryMovements[index];
            const {warehouseId, branchId, quotationProducts, } = inventories;
            const {id, product, model, originCode, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, assembledProducts, SKU, stock} = quotationProducts;
            const {document, classificationId, lineId, brandId, line, name} = product
            console.log(assembledProducts)
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
                warehouse.push({
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
                branch.push({
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
            }
        }
        return {
            warehouse,
            branch,
        };
    }

}
