import * as Joi from "joi";

export const schemaActivateDeactivateCustomer = Joi.object({
    activateDeactivateComment: Joi.string().required()
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
})



