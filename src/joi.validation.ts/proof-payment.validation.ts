
import * as Joi from "joi";
import {ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE} from '../enums';

export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})
export const schemaProofPaymentQuotationInside = Joi.object({
    id: Joi.number().allow(null),
    paymentDate: Joi.string().required(),
    paymentType: Joi.string().valid(...Object.values(PaymentTypeProofE)).messages({
        'any.only': `El tipo de pago debe ser igual a uno de los valores permitidos.`
    }),
    proofPaymentType: Joi.string().valid(...Object.values(ExchangeRateQuotationE)).messages({
        'any.only': `El tipo de comprobante debe ser igual a uno de los valores permitidos.`
    }),
    exchangeRate: Joi.string().valid(...Object.values(ExchangeRateE)).messages({
        'any.only': `El tipo de cambio debe ser igual a uno de los valores permitidos.`
    }),
    advanceCustomer: Joi.number().required(),
    conversionAdvance: Joi.number().required(),
    quotationId: Joi.number().required(),
    images: Joi.array().items(documents).optional(),
})
