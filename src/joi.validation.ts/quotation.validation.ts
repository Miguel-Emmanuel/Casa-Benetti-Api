import * as Joi from "joi";

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
    percentageAdditionalDiscount: Joi.number(),
    subtotal: Joi.number(),

})
export const schemaCreateQuotition = Joi.object({
    id: Joi.number().allow(null),
    client: Joi.object({
        clientId: Joi.number(),
        firstName: Joi.string(),
        lastName: Joi.string(),
        motherLastName: Joi.string(),
        address: Joi.object({
            street: Joi.string().allow(''),
            extNum: Joi.string().allow(''),
            intNum: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
            suburb: Joi.string().allow(''),
            city: Joi.string().allow(''),
            state: Joi.string().allow(''),
            country: Joi.string().allow(''),
        }),
        addressDescription: Joi.string(),
        phone: Joi.string(),
        isInvoice: Joi.boolean(),
        rfc: Joi.string(),
        businessName: Joi.string(),
        groupId: Joi.number(),

    }),
    commissions: Joi.object({
        isArchitect: Joi.boolean().required(),
        architectName: Joi.string(),
        commissionPercentageArchitect: Joi.number(),
        isReferencedClient: Joi.boolean().required(),
        commissionPercentagereferencedClient: Joi.number(),
        referencedClientId: Joi.number(),
        isProjectManager: Joi.boolean().required(),
        projectManager: Joi.array().items(projectManager),
        isDesigner: Joi.boolean().required(),
        designer: Joi.array().items(designer),
    }),
    products: Joi.array().items(products),
    quotation: Joi.object({
        subtotal: Joi.number(),
        percentageAdditionalDiscount: Joi.number(),
        additionalDiscount: Joi.number(),
        percentageIva: Joi.number(),
        iva: Joi.number(),
        total: Joi.number(),
        percentageAdvance: Joi.number(),
        advance: Joi.number(),
        exchangeRate: Joi.number(),
        balance: Joi.number(),
    }),
})
