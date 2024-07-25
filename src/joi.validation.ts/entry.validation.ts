import * as Joi from "joi";
import {InventoriesIssueE, InventoriesReasonE} from '../enums';

const schemaProducts = Joi.object({
    quotationProductsId: Joi.number().required(),
})


export const schemaCreateEntry = Joi.object({
    reasonEntry: Joi.string().valid(...Object.values(InventoriesReasonE)).messages({
        'any.only': `El motivo debe ser igual a uno de los valores permitidos.`
    }).required(),
    containerNumber: Joi.when('reason', {is: InventoriesReasonE.DESCARGA_CONTENEDOR, then: Joi.string().required()}),
    collectionNumber: Joi.when('reason', {is: InventoriesReasonE.DESCARGA_RECOLECCION, then: Joi.string().required()}),
    products: Joi.when('reason', {is: [InventoriesReasonE.DESCARGA_RECOLECCION, InventoriesReasonE.DESCARGA_CONTENEDOR], then: Joi.array().items(schemaProducts).required()}),
    branchId: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().allow(null)}),
    warehouseId: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().allow(null)}),
    projectId: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().required()}),
    quotationProductsId: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().required()}),
    quantity: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.number().required().positive().message('La cantidad debe ser mayor a 0.')}),
    comment: Joi.when('reason', {is: [InventoriesReasonE.REPARACION, InventoriesReasonE.PRESTAMO, InventoriesReasonE.DEVOLUCION], then: Joi.string().required()}),
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
    collectionNumber: Joi.when('reason', {is: InventoriesIssueE.CONTENEDOR, then: Joi.string().required()}),
    destinationBranchId: Joi.when('reason', {is: InventoriesIssueE.REASIGNAR, then: Joi.string().required()}),
})
