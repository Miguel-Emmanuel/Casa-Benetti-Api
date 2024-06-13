import * as Joi from "joi";
import {ExchangeRateE} from '../enums';

const projectManager = Joi.object({
    userId: Joi.number(),
    commissionPercentageProjectManager: Joi.number(),
})

const designer = Joi.object({
    userId: Joi.number(),
    commissionPercentageDesigner: Joi.number(),
})
const products = Joi.object({
    productId: Joi.number(),
    typeSale: Joi.string(),
    isSeparate: Joi.boolean().required(),
    percentageSeparate: Joi.number(),
    reservationDays: Joi.number(),
    provedorId: Joi.number(),
    quantity: Joi.number(),
    percentageDiscountProduct: Joi.number(),
    discountProduct: Joi.number(),
    percentageAdditionalDiscount: Joi.number(),
    additionalDiscount: Joi.number(),
    subtotal: Joi.number(),

})
export const schemaCreateQuotition = Joi.object({
    id: Joi.number().allow(null),
    isDraft: Joi.boolean().required(),
    customer: Joi.object({
        customerId: Joi.number().allow(null),
        name: Joi.string().allow(null),
        lastName: Joi.string().allow(null),
        secondLastName: Joi.string().allow(null),
        address: Joi.object({
            street: Joi.string().allow('').allow(null),
            extNum: Joi.string().allow('').allow(null),
            intNum: Joi.string().allow('').allow(null),
            zipCode: Joi.string().allow('').allow(null),
            suburb: Joi.string().allow('').allow(null),
            city: Joi.string().allow('').allow(null),
            state: Joi.string().allow('').allow(null),
            country: Joi.string().allow('').allow(null),
        }),
        addressDescription: Joi.string().allow(null),
        phone: Joi.string().allow(null),
        invoice: Joi.boolean().allow(null),
        rfc: Joi.string().allow(null),
        businessName: Joi.string().allow(null),
        regimen: Joi.string().allow(null),
        groupId: Joi.number().allow(null),

    }),
    projectManagers: Joi.array().items(projectManager).optional(),
    designers: Joi.array().items(designer).optional(),
    products: Joi.array().items(products).optional(),
    quotation: Joi.object({
        commissionPercentageArchitect: Joi.number().allow(null),
        isArchitect: Joi.boolean().allow(null),
        architectName: Joi.string().allow(null),
        referenceCustomerId: Joi.number().allow(null),
        isReferencedCustomer: Joi.boolean().allow(null),
        commissionPercentagereferencedCustomer: Joi.number().allow(null),
        isProjectManager: Joi.boolean().allow(null),
        isDesigner: Joi.boolean().allow(null),
        subtotal: Joi.number().allow(null),
        percentageAdditionalDiscount: Joi.number().allow(null),
        additionalDiscount: Joi.number().allow(null),
        percentageIva: Joi.number().allow(null),
        iva: Joi.number().allow(null),
        total: Joi.number().allow(null),
        percentageAdvance: Joi.number().allow(null),
        advance: Joi.number().allow(null),
        exchangeRate: Joi.string().valid(...Object.values(ExchangeRateE)).messages({
            'any.only': `El tipo de cambio debe ser igual a uno de los valores permitidos.`
        }).allow(null),
        balance: Joi.number().allow(null),
    }),
})
