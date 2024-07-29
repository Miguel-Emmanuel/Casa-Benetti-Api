import * as Joi from "joi";
import {InventoriesIssueE, InventoriesReasonE} from '../enums';

const schemaProducts = Joi.object({
    quotationProductsId: Joi.number().required(),
})


export const schemaCreateEntry = Joi.object({
    reasonEntry: Joi.string().valid(...Object.values(InventoriesReasonE)).messages({
        'any.only': `El motivo debe ser igual a uno de los valores permitidos.`
    }).required(),
    containerNumber: Joi.when('reasonEntry', {is: InventoriesReasonE.DESCARGA_CONTENEDOR, then: Joi.string().required(), otherwise: Joi.forbidden()}),
    collectionNumber: Joi.when('reasonEntry', {is: InventoriesReasonE.DESCARGA_RECOLECCION, then: Joi.string().required(), otherwise: Joi.forbidden()}),
    products: Joi.when('reasonEntry', {is: [InventoriesReasonE.DESCARGA_RECOLECCION, InventoriesReasonE.DESCARGA_CONTENEDOR], then: Joi.array().items(schemaProducts).required(), otherwise: Joi.forbidden()}),
    branchId: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().allow(null), otherwise: Joi.forbidden()}),
    warehouseId: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().allow(null), otherwise: Joi.forbidden()}),
    projectId: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.string().required(), otherwise: Joi.forbidden()}),
    quotationProductsId: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().required(), otherwise: Joi.forbidden()}),
    quantity: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().required().positive().message('La cantidad debe ser mayor a 0.'), otherwise: Joi.forbidden()}),
    comment: Joi.when('reasonEntry', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.string().required(), otherwise: Joi.forbidden()}),
})



export const schemaCreateIssue = Joi.object({
    reasonIssue: Joi.string().valid(...Object.values(InventoriesIssueE)).messages({
        'any.only': `El motivo debe ser igual a uno de los valores permitidos.`
    }).required(),
    branchId: Joi.number().allow(null),
    warehouseId: Joi.number().allow(null),
    quotationProductsId: Joi.number().required(),
    quantity: Joi.number().positive().message('La cantidad debe ser mayor a 0.').required(),
    comment: Joi.string().required(),
    collectionNumber: Joi.when('reasonIssue', {is: InventoriesIssueE.CONTENEDOR, then: Joi.string().required()}),
    destinationBranchId: Joi.when('reasonIssue', {is: InventoriesIssueE.REASIGNAR, then: Joi.number().required()}),
    destinationWarehouseId: Joi.when('reasonIssue', {is: InventoriesIssueE.REASIGNAR, then: Joi.number().required()}),
})
