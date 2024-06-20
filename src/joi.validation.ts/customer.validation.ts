import * as Joi from "joi";

export const schemaActivateDeactivateCustomer = Joi.object({
    activateDeactivateComment: Joi.string().required()
})
