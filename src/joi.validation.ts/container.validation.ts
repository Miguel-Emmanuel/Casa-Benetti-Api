import * as Joi from "joi";
import {ContainerStatus} from '../enums';


export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})
export const schemaCreateContainer = Joi.object({
    pedimento: Joi.string().allow(null).allow(''),
    containerNumber: Joi.string().required(),
    invoiceNumber: Joi.string().allow('').allow(null),
    grossWeight: Joi.string().allow('').allow(null),
    numberBoxes: Joi.number().allow(null),
    measures: Joi.string().allow('').allow(null),
    ETDDate: Joi.date().allow(null),
    ETADate: Joi.date().allow(null),
    docs: Joi.array().items(documents).optional(),
})

const schemaProducts = Joi.object({
    id: Joi.number().required(),
    grossWeight: Joi.string().required(),
    netWeight: Joi.string().required(),
    numberBoxes: Joi.number().required(),
    descriptionPedimiento: Joi.string().required(),
    NOMS: Joi.array().items(Joi.string().required()).required()
})

const schemaPurchaseOrders = Joi.object({
    id: Joi.number().required(),
    products: Joi.array().items(schemaProducts).required(),
})

export const schemaUpdateContainer = Joi.object({
    pedimento: Joi.string().required(),
    grossWeight: Joi.string().required(),
    numberBoxes: Joi.number().required(),
    measures: Joi.string().required(),
    status: Joi.string().valid(...Object.values(ContainerStatus)).messages({
        'any.only': `El estatus de pago debe ser igual a uno de los valores permitidos.`
    }),
    docs: Joi.array().items(documents).optional(),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})
