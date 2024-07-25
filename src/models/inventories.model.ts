import {belongsTo, Entity, model, property} from '@loopback/repository';
import {QuotationProducts} from './quotation-products.model';

@model()
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

    @property({
        type: 'number',
    })
    stock: number;

    //Producto
    @belongsTo(() => QuotationProducts)
    quotationProductsId: number;

    //Sucursal/showrooms
    @property({
        type: 'number',
    })
    branchId?: number;

    //Bodega/Warehouse
    @property({
        type: 'number',
    })
    warehouseId?: number;


    constructor(data?: Partial<Inventories>) {
        super(data);
    }
}

export interface InventoriesRelations {
    // describe navigational properties here
}

export type InventoriesWithRelations = Inventories & InventoriesRelations;
