import * as Joi from "joi";


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
