import * as Joi from "joi";
import {TypeRegimenE} from '../enums';

export const schemaActivateDeactivateCustomer = Joi.object({
    activateDeactivateComment: Joi.string().required()
})



export const schemaCreateCustomer = Joi.object({
    name: Joi.string().required(),
    lastName: Joi.string().allow('').allow(null),
    secondLastName: Joi.string().allow('').allow(null),
    address: Joi.object({
        street: Joi.string().allow('').allow(null),
        extNum: Joi.string().allow('').allow(null),
        intNum: Joi.string().allow('').allow(null),
        zipCode: Joi.string().regex(/^[0-9]{5}$/).message('El código postal debe contener 5 dígitos').allow('').allow(null),
        suburb: Joi.string().allow('').allow(null),
        city: Joi.string().allow('').allow(null),
        state: Joi.string().allow('').allow(null),
        country: Joi.string().allow('').allow(null),
    }).optional(),
    addressDescription: Joi.string().allow('').allow(null),
    phone: Joi.string().regex(/^[0-9]{10}$/).message('El teléfono debe contener mínimo 10 dígitos').allow('').allow(null),
    invoice: Joi.boolean().allow(null),
    rfc: Joi.string().allow('').allow(null),
    businessName: Joi.string().allow('').allow(null),
    regimen: Joi.string().valid(...Object.values(TypeRegimenE)).messages({
        'any.only': `El moneda de compra debe ser igual a uno de los valores permitidos.`
    }).allow(null).allow(''),
    groupId: Joi.number().allow(null),
})



