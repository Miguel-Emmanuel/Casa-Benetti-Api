import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CollectionStatus, InventoriesIssueE, InventoriesReasonE, InventoryMovementsTypeE, PurchaseOrdersStatus, QuotationProductStatusE} from '../enums';
import {EntryDataI, IssueDataI} from '../interface';
import {schemaCreateEntry, schemaCreateIssue} from '../joi.validation.ts/entry.validation';
import {ResponseServiceBindings} from '../keys';
import {PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {BranchRepository, CollectionRepository, ContainerRepository, InventoriesRepository, InventoryMovementsRepository, ProjectRepository, PurchaseOrdersRepository, QuotationProductsRepository, WarehouseRepository} from '../repositories';
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
        public projectRepository: ProjectRepository,
        @repository(PurchaseOrdersRepository)
        public purchaseOrdersRepository: PurchaseOrdersRepository,
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @repository(CollectionRepository)
        public collectionRepository: CollectionRepository
    ) { }

    async entry(data: EntryDataI) {
        await this.validateBodyEntry(data);
        const {reasonEntry} = data
        if (reasonEntry === InventoriesReasonE.DESCARGA_CONTENEDOR || reasonEntry === InventoriesReasonE.DESCARGA_RECOLECCION) {
            const {containerId, collectionId, purchaseOrders} = data;
            if (reasonEntry === InventoriesReasonE.DESCARGA_CONTENEDOR) {

                const container = await this.containerRepository.findOne({where: {id: containerId}});
                if (!container)
                    throw this.responseService.notFound('El contenedor no existe.');

                for (let index = 0; index < purchaseOrders?.length; index++) {
                    const {products, id} = purchaseOrders[index];
                    let quantity = products.reduce((accumulator, item) => accumulator + item.quantity, 0);
                    for (let index = 0; index < products.length; index++) {
                        const element = products[index];
                        const quotationProduct = await this.validateQuotationProduct(element.quotationProductsId);
                        let inventorie;
                        inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId: element.quotationProductsId}, {containerId}]}})
                        if (!inventorie) {
                            inventorie = await this.inventoriesRepository.create({stock: quantity, quotationProductsId: element.quotationProductsId, containerId})
                        } else {
                            const {stock} = inventorie;
                            await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock + quantity)})
                        }
                        await this.inventoryMovementsRepository.create({quantity, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorie.id, reasonEntry});
                        await this.addQuotationProductsToStock(element.quotationProductsId, quantity, quotationProduct.stock);
                        await this.quotationProductsRepository.updateById(element.quantity, {status: QuotationProductStatusE.BODEGA_NACIONAL})
                    }
                    await this.purchaseOrdersRepository.updateById(id, {status: PurchaseOrdersStatus.BODEGA_NACIONAL})

                }
            }
            if (reasonEntry === InventoriesReasonE.DESCARGA_RECOLECCION) {

                const collection = await this.collectionRepository.findOne({where: {id: collectionId}, include: [{relation: 'purchaseOrders'}]});
                if (!collection)
                    throw this.responseService.notFound('La recoleccion no existe.');

                for (let index = 0; index < purchaseOrders?.length; index++) {
                    const {products, id} = purchaseOrders[index];
                    let quantity = products.reduce((accumulator, item) => accumulator + item.quantity, 0);
                    for (let index = 0; index < products.length; index++) {
                        const element = products[index];
                        const quotationProduct = await this.validateQuotationProduct(element.quotationProductsId);
                        let inventorie;
                        inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId: element.quotationProductsId}, {collectionId}]}})
                        if (!inventorie) {
                            inventorie = await this.inventoriesRepository.create({stock: quantity, quotationProductsId: element.quotationProductsId, collectionId})
                        } else {
                            const {stock} = inventorie;
                            await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock + quantity)})
                        }
                        await this.inventoryMovementsRepository.create({quantity, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorie.id, reasonEntry});
                        await this.addQuotationProductsToStock(element.quotationProductsId, quantity, quotationProduct.stock);
                        await this.quotationProductsRepository.updateById(element.quantity, {status: QuotationProductStatusE.BODEGA_INTERNACIONAL})
                    }
                    await this.purchaseOrdersRepository.updateById(id, {status: PurchaseOrdersStatus.BODEGA_INTERNACIONAL})
                }
                await this.collectionRepository.updateById(collectionId, {status: CollectionStatus.COMPLETADO})
            }
        } else {
            //Reparacion, Préstamo o Devolución
            const {branchId, warehouseId, quotationProductsId, quantity, projectId, comment} = data
            if (!branchId && !warehouseId)
                return this.responseService.badRequest('"Debe ingresar al menos un identificador: branchId o warehouseId');
            const quotationProduct = await this.validateQuotationProduct(quotationProductsId);
            const project = await this.validateDataEntry(projectId, branchId, warehouseId);
            try {
                let inventorie: any;
                if (branchId)
                    inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {branchId}]}})
                else if (warehouseId)
                    inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {warehouseId}]}})

                if (!inventorie) {
                    inventorie = await this.inventoriesRepository.create({stock: quantity, quotationProductsId, warehouseId, branchId})
                } else {
                    const {stock} = inventorie;
                    await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock + quantity)})
                }
                await this.inventoryMovementsRepository.create({quantity, projectId: project?.id, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorie.id, reasonEntry, comment});
                await this.addQuotationProductsToStock(quotationProductsId, quantity, quotationProduct.stock);
                await this.validateWareHouseMexicoAndItalia(quotationProductsId, warehouseId)
            } catch (error) {
                throw this.responseService.badRequest(error.message ?? error)
            }
        }
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async validateWareHouseMexicoAndItalia(quotationProductsId: number, warehouseId?: number) {
        if (warehouseId) {
            const warehouse = await this.warehouseRepository.findOne({where: {id: warehouseId}})
            if (warehouse) {
                switch (warehouse.name) {
                    case 'México':
                        await this.processValidateWareHouseMexicoAndItalia(quotationProductsId, PurchaseOrdersStatus.BODEGA_INTERNACIONAL, warehouseId);
                        break;
                    case 'Italia':
                        await this.processValidateWareHouseMexicoAndItalia(quotationProductsId, PurchaseOrdersStatus.BODEGA_NACIONAL, warehouseId);
                        break;

                    default:
                        break;
                }
            }
        }
    }

    async processValidateWareHouseMexicoAndItalia(quotationProductsId: number, status: PurchaseOrdersStatus, warehouseId?: number,) {
        const quotationProduct = await this.quotationProductsRepository.findById(quotationProductsId);
        const quotationProducts = await this.quotationProductsRepository.find({where: {proformaId: quotationProduct.proformaId}});
        let countInventorie = 0;
        for (let index = 0; index < quotationProducts.length; index++) {
            const element = quotationProducts[index];
            const inventorie = await this.inventoriesRepository.findOne({where: {warehouseId, quotationProductsId: element.id}})
            if (inventorie)
                countInventorie += 1;
        }
        if (countInventorie === quotationProducts.length) {
            const purchaseOrder = await this.purchaseOrdersRepository.findOne({where: {proformaId: quotationProduct.proformaId}})
            await this.purchaseOrdersRepository.updateById(purchaseOrder?.id, {status})
        }
    }

    async issue(data: IssueDataI) {
        await this.validateBodyIssue(data);
        const {branchId, warehouseId, quotationProductsId, quantity, comment} = data
        if (!branchId && !warehouseId)
            return this.responseService.badRequest('"Debe ingresar al menos un identificador: branchId o warehouseId');
        const quotationProduct = await this.validateQuotationProduct(quotationProductsId);
        await this.validateDataIssue(branchId, warehouseId);
        try {
            const {reasonIssue, destinationBranchId, containerId, destinationWarehouseId} = data;
            // let inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {or: [{branchId}, {warehouseId}]}]}})
            let inventorie: any;
            if (branchId)
                inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {branchId}]}})
            else if (warehouseId)
                inventorie = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {warehouseId}]}})
            if (inventorie) {
                const {stock} = inventorie;
                await this.inventoriesRepository.updateById(inventorie.id, {stock: (stock - quantity)})
                await this.inventoryMovementsRepository.create({quantity, type: InventoryMovementsTypeE.SALIDA, inventoriesId: inventorie.id, reasonIssue, comment, destinationBranchId, containerId, destinationWarehouseId});
                await this.quotationProductsRepository.updateById(quotationProductsId, {stock: (quotationProduct.stock - quantity)})
                if (reasonIssue === InventoriesIssueE.ENTREGA_CLIENTE) {
                    await this.quotationProductsRepository.updateById(quotationProductsId, {status: QuotationProductStatusE.TRANSITO_NACIONAL})
                }

                if (reasonIssue === InventoriesIssueE.REASIGNAR) {
                    let inventorieReasinar;
                    if (destinationWarehouseId) {
                        inventorieReasinar = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {warehouseId: destinationWarehouseId}]}})
                        if (!inventorieReasinar) {
                            inventorieReasinar = await this.inventoriesRepository.create({stock: quantity, quotationProductsId, warehouseId: destinationWarehouseId})
                        } else {
                            await this.inventoriesRepository.updateById(inventorieReasinar.id, {stock: (inventorieReasinar?.stock + quantity)})
                        }
                        await this.inventoryMovementsRepository.create({quantity, projectId: undefined, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorieReasinar.id, reasonEntry: undefined, comment});
                    }
                    if (destinationBranchId) {
                        inventorieReasinar = await this.inventoriesRepository.findOne({where: {and: [{quotationProductsId}, {branchId: destinationBranchId}]}})
                        if (!inventorieReasinar) {
                            inventorieReasinar = await this.inventoriesRepository.create({stock: quantity, quotationProductsId, branchId: destinationBranchId})
                        } else {
                            await this.inventoriesRepository.updateById(inventorieReasinar.id, {stock: (inventorieReasinar?.stock + quantity)})
                        }
                        await this.inventoryMovementsRepository.create({quantity, projectId: undefined, type: InventoryMovementsTypeE.ENTRADA, inventoriesId: inventorieReasinar.id, reasonEntry: undefined, comment});
                    }
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

    async validateDataEntry(projectId: string, branchId: number, warehouseId: number,) {
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

        const project = await this.projectRepository.findOne({where: {projectId}})
        if (!project)
            throw this.responseService.badRequest('El proyecto no existe.')

        return project;
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

    async findCollection(id: number) {
        const collection = await this.collectionRepository.findOne({
            where: {id}, include: [
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
        });
        if (!collection)
            throw this.responseService.badRequest('El contenedor/recoleccion no existe;');

        return collection?.purchaseOrders ? collection?.purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
            const {id: purchaseOrderid, proforma} = value;
            const {quotationProducts} = proforma;
            return {
                id: purchaseOrderid,
                products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                    const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, invoiceNumber, grossWeight, netWeight, numberBoxes, NOMS} = value;
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
                        invoiceNumber,
                        grossWeight,
                        netWeight,
                        numberBoxes,
                        NOMS
                    }
                })
            }
        }) : []
    }

    async updateProducts(data: {purchaseOrders: {id: number, products: {id: number, quantity: number, commentEntry: string}[]}[]}) {
        const {purchaseOrders} = data;
        for (let index = 0; index < purchaseOrders?.length; index++) {
            const {products} = purchaseOrders[index];
            for (let index = 0; index < products?.length; index++) {
                const {id, quantity, commentEntry} = products[index];
                await this.quotationProductsRepository.updateById(id, {quantity, commentEntry})
            }
        }
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }

    async findContainer(id: number) {
        const container = await this.containerRepository.findOne({
            where: {id}, include: [
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
        });
        return container?.collection?.purchaseOrders ? container?.collection?.purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
            const {id: purchaseOrderid, proforma} = value;
            const {quotationProducts} = proforma;
            return {
                id: purchaseOrderid,
                products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                    const {id: productId, product, SKU, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, numberBoxes, quantity, commentEntry} = value;
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
                        numberBoxes,
                        quantity,
                        commentEntry
                    }
                })
            }
        }) : []

    }



}
