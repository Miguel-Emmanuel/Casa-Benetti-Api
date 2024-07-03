import * as Joi from "joi";
import {ExchangeRateE, PaymentTypeProofE, TypeAdvancePaymentRecordE} from '../enums';
export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})
export const schameCreateAdvancePayment = Joi.object({
    paymentDate: Joi.date().required(),
    paymentMethod: Joi.string().valid(...Object.values(PaymentTypeProofE)).messages({
        'any.only': `El metodo de pago debe ser igual a uno de los valores permitidos.`
    }).required(),
    amountPaid: Joi.number().required(),
    paymentCurrency: Joi.string().valid(...Object.values(ExchangeRateE)).messages({
        'any.only': `La moneda de pago debe ser igual a uno de los valores permitidos.`
    }).required(),
    parity: Joi.number().required(),
    percentageIva: Joi.number().required(),
    accountsReceivableId: Joi.number().required(),
    currencyApply: Joi.string().required(),
    conversionAmountPaid: Joi.number().required(),
    subtotalAmountPaid: Joi.number().required(),
    paymentPercentage: Joi.number().required(),
    type: Joi.string().valid(...Object.values(TypeAdvancePaymentRecordE)).messages({
        'any.only': `El tipo de cobro debe ser igual a uno de los valores permitidos.`
    }).required(),
    vouchers: Joi.array().items(documents).optional(),
    salesDeviation: Joi.number().required(),
})
