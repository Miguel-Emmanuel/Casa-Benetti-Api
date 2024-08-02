import * as Joi from "joi";
import {DeliveryRequestStatusE} from '../enums';


const schemaProducts = Joi.object({
    id: Joi.number().required(),
    isSelected: Joi.boolean().required(),
})

const schemaPurchaseOrders = Joi.object({
    id: Joi.number().required(),
    products: Joi.array().items(schemaProducts).required(),
})

export const schemaDeliveryRequest = Joi.object({
    projectId: Joi.number().required(),
    deliveryDay: Joi.date().required(),
    comment: Joi.string().allow(null),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})




export const schemaDeliveryRequestPatch = Joi.object({
    deliveryDay: Joi.date().required(),
    comment: Joi.string().allow(null),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})


export const schemaDeliveryRequestPatchStatus = Joi.object({
    status: Joi.string().valid(DeliveryRequestStatusE.PROGRAMADA, DeliveryRequestStatusE.RECHAZADA).messages({
        'any.only': `El status debe ser igual a uno de los valores permitidos.`
    }).required(),
    reason: Joi.when('status', {is: [DeliveryRequestStatusE.RECHAZADA], then: Joi.string().required(), otherwise: Joi.forbidden()}),
})


export const schemaDeliveryRequestPatchFeedback = Joi.object({
    status: Joi.string().valid(DeliveryRequestStatusE.PROGRAMADA, DeliveryRequestStatusE.RECHAZADA, DeliveryRequestStatusE.ENTREGA_PARCIAL, DeliveryRequestStatusE.ENTREGA_COMPLETA).messages({
        'any.only': `El status debe ser igual a uno de los valores permitidos.`
    }).required(),
    feedbackComment: Joi.string().required(),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})
