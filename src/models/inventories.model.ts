import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import {Branch, BranchWithRelations} from './branch.model';
import {InventoryMovements} from './inventory-movements.model';
import {QuotationProducts, QuotationProductsWithRelations} from './quotation-products.model';
import {Warehouse, WarehouseWithRelations} from './warehouse.model';

@model({
    settings: {
        postgresql: {
            table: 'Inventories' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_quotationProduct_quotationProductsId: {
                name: 'fk_quotationProduct_quotationProductsId',
                entity: 'QuotationProducts',
                entityKey: 'id',
                foreignKey: 'quotationproductsid',
            },
            fk_warehouse_warehouseId: {
                name: 'fk_warehouse_warehouseId',
                entity: 'Warehouse',
                entityKey: 'id',
                foreignKey: 'warehouseid',
            },
            fk_branch_branchId: {
                name: 'fk_branch_branchId',
                entity: 'Branch',
                entityKey: 'id',
                foreignKey: 'branchid',
            },

        }
    }
})
export class Inventories extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    //Cantidad real del producto
    @property({
        type: 'number',
        default: 0
    })
    stock: number;

    //Producto
    @belongsTo(() => QuotationProducts)
    quotationProductsId: number;

    @hasMany(() => InventoryMovements)
    inventoryMovements: InventoryMovements[];

    //Sucursal/showrooms
    @belongsTo(() => Warehouse)
    warehouseId: number;

    //Bodega/Warehouse
    @belongsTo(() => Branch)
    branchId: number;

    constructor(data?: Partial<Inventories>) {
        super(data);
    }
}

export interface InventoriesRelations {
    // describe navigational properties here
    quotationProducts: QuotationProductsWithRelations
    warehouse: WarehouseWithRelations
    branch: BranchWithRelations
}

export type InventoriesWithRelations = Inventories & InventoriesRelations;
