import * as Joi from "joi";
import {CollectionDestinationE} from '../enums';


export const schemaPurchaseOrders = Joi.number().required()

const schemaProducts = Joi.object({
    id: Joi.number().required(),
    isSelected: Joi.boolean().required(),
})

const schemaPurchaseOrdersData = Joi.object({
    id: Joi.number().required(),
    products: Joi.array().items(schemaProducts).required(),
})

export const schemaCollectionCreate = Joi.object({
    destination: Joi.string().valid(...Object.values(CollectionDestinationE)).messages({
        'any.only': `El destino debe ser igual a uno de los valores permitidos.`
    }).required(),
    dateCollection: Joi.date().required(),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})

export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})

export const schemaCollectionPatchFeedback = Joi.object({
    destination: Joi.string().valid(...Object.values(CollectionDestinationE)).messages({
        'any.only': `El destino debe ser igual a uno de los valores permitidos.`
    }).required(),
    containerId: Joi.when('destination', {is: [CollectionDestinationE.CONTENEDOR], then: Joi.number().required(), otherwise: Joi.forbidden()}),
    dateCollection: Joi.date().required(),
    documents: Joi.array().items(documents).optional(),
    purchaseOrders: Joi.array().items(schemaPurchaseOrdersData).required(),
})
