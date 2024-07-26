import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {InventoriesIssueE, InventoriesReasonE, InventoryMovementsTypeE, QuotationProductStatusE} from '../enums';
import {EntryDataI, IssueDataI} from '../interface';
import {schemaCreateEntry, schemaCreateIssue} from '../joi.validation.ts/entry.validation';
import {ResponseServiceBindings} from '../keys';
import {BranchRepository, InventoriesRepository, InventoryMovementsRepository, ProjectRepository, QuotationProductsRepository, WarehouseRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class InventoryMovementsService {
    constructor(
        @repository(InventoryMovementsRepository)
        public inventoryMovementsRepository: InventoryMovementsRepository,
        @repository(InventoriesRepository)
        public inventoriesRepository: InventoriesRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository,
        @repository(BranchRepository)
        public branchRepository: BranchRepository,
        @repository(WarehouseRepository)
        public warehouseRepository: WarehouseRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository
    ) { }

    async entry(data: EntryDataI) {
        await this.validateBodyEntry(data);
        const {reasonEntry} = data
        if (reasonEntry === InventoriesReasonE.DESCARGA_CONTENEDOR || reasonEntry === InventoriesReasonE.DESCARGA_RECOLECCION) {

            if (reasonEntry === InventoriesReasonE.DESCARGA_CONTENEDOR) {
                //Falta aqui la logica para traer los productos relacionados al contenedor

                //Si el numero de contenedor estará a nivel orden de compra entonces desde orden de compra accedidnedo a la proforma podemos recuperar el branchid y el listado de productos
                //Remplazar por lista de productos relacionadas al contenedor
                const branchId = 1
                const products: any = [{quotationProductsId: 1, quantity: 2}];
                for (let index = 0; index < products.length; index++) {
                    const element = products[index];
                    //Validar si existe un registro de inventario validando por quotationProductsId y branchId
                }
            }
            if (reasonEntry === InventoriesReasonE.DESCARGA_RECOLECCION) {
            }
        } else {
            //Reparacion, Préstamo o Devolución
            const {branchId, warehouseId, quotationProductsId, quantity, projectId, comment} = data
            if (!branchId && !warehouseId)
                return this.responseService.badRequest('"Debe ingresar al menos un identificador: branchId o warehouseId');
            const quotationProduct = await this.validateQuotationProduct(quotationProductsId);
            await this.validateDataEntry(projectId, branchId, warehouseId);
            try {
                let inventorie: any = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {or: [{branchId}, {warehouseId}]}]}})
                if (!inventorie) {
                    inventorie = await this.inventoriesRepository.create({stock: quantity, quotationProductsId, warehouseId, branchId})
                } else {
                    const {stock} = inventorie;
                    await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock + quantity)})
                }
                await this.inventoryMovementsRepository.create({quantity, projectId, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorie.id, reasonEntry, comment});
                await this.addQuotationProductsToStock(quotationProductsId, quantity, quotationProduct.stock);
            } catch (error) {
                throw this.responseService.badRequest(error.message ?? error)
            }
        }
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async issue(data: IssueDataI) {
        await this.validateBodyIssue(data);
        const {branchId, warehouseId, quotationProductsId, quantity, comment} = data
        if (!branchId && !warehouseId)
            return this.responseService.badRequest('"Debe ingresar al menos un identificador: branchId o warehouseId');
        const quotationProduct = await this.validateQuotationProduct(quotationProductsId);
        await this.validateDataIssue(branchId, warehouseId);
        try {
            const {reasonIssue, destinationBranchId, containerNumber, destinationWarehouseId} = data;
            let inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {or: [{branchId}, {warehouseId}]}]}})
            if (inventorie) {
                const {stock} = inventorie;
                await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock - quantity)})
                await this.inventoryMovementsRepository.create({quantity, type: InventoryMovementsTypeE.SALIDA, inventoriesId: inventorie.id, reasonIssue, comment, destinationBranchId, containerNumber, destinationWarehouseId});
                await this.quotationProductsRepository.updateById(quotationProductsId, {stock: (quotationProduct.stock - quantity)})
                if (reasonIssue === InventoriesIssueE.ENTREGA_CLIENTE) {
                    await this.quotationProductsRepository.updateById(quotationProductsId, {status: QuotationProductStatusE.TRANSITO_NACIONAL})
                }
            }
        } catch (error) {
            throw this.responseService.badRequest(error.message ?? error)
        }
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }


    async addQuotationProductsToStock(quotationProductsId: number, quantity: number, stock: number) {
        await this.quotationProductsRepository.updateById(quotationProductsId, {stock: (stock + quantity)})
    }

    async validateQuotationProduct(id: number) {
        const product = await this.quotationProductsRepository.findOne({where: {id}, fields: ['id', 'stock', 'quantity']})
        if (!product)
            throw this.responseService.badRequest('El producto no existe.')
        return product
    }

    async validateDataEntry(projectId: number, branchId: number, warehouseId: number,) {
        if (branchId) {
            const branch = await this.branchRepository.findOne({where: {id: branchId}})
            if (!branch)
                throw this.responseService.badRequest('La sucursal no existe.')
        }
        if (warehouseId) {
            const warehouse = await this.warehouseRepository.findOne({where: {id: warehouseId}})
            if (!warehouse)
                throw this.responseService.badRequest('El almacen no existe.')
        }

        const project = await this.projectRepository.findOne({where: {id: projectId}})
        if (!project)
            throw this.responseService.badRequest('El proyecto no existe.')
    }

    async validateDataIssue(branchId: number, warehouseId: number,) {
        if (branchId) {
            const branch = await this.branchRepository.findOne({where: {id: branchId}})
            if (!branch)
                throw this.responseService.badRequest('La sucursal no existe.')
        }
        if (warehouseId) {
            const warehouse = await this.warehouseRepository.findOne({where: {id: warehouseId}})
            if (!warehouse)
                throw this.responseService.badRequest('El almacen no existe.')
        }
    }

    async validateBodyEntry(data: EntryDataI) {
        try {
            await schemaCreateEntry.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

    async validateBodyIssue(data: IssueDataI) {
        try {
            await schemaCreateIssue.validateAsync(data);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
        }
    }

}
