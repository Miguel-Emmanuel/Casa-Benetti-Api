import * as Joi from "joi";
import {CommissionPaymentStatus} from '../enums';

export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})

export const schemaCommissionPaymentCreate = Joi.object({
    paymentDate: Joi.date().required(),
    commissionPaymentRecordId: Joi.number().required(),
    amount: Joi.number().required(),
    images: Joi.array().items(documents).optional(),
})

export const schemaCommissionPaymentUpdate = Joi.object({
    paymentDate: Joi.date().required(),
    status: Joi.string().valid(...Object.values(CommissionPaymentStatus)).messages({
        'any.only': `El estatus de pago debe ser igual a uno de los valores permitidos.`
    }),
    amount: Joi.number().required(),
    images: Joi.array().items(documents).optional(),
})
