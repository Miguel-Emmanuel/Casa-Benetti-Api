import * as Joi from "joi";
import {CurrencyE, ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE} from '../enums';

export const documents = Joi.object({
    id: Joi.number(),
    fileURL: Joi.string().required(),
    name: Joi.string().required(),
    extension: Joi.string().required(),
})

export const schemaProofPaymentQuotation = Joi.object({
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
    // quotationId: Joi.number().required(),
    images: Joi.array().items(documents).optional(),
})

export const schemaProofPaymentQuotationQ = Joi.object({
    id: Joi.number().allow(null),
    paymentDate: Joi.string().required(),
    proofPaymentType: Joi.string().valid(...Object.values(ExchangeRateQuotationE)).messages({
        'any.only': `El tipo de comprobante debe ser igual a uno de los valores permitidos.`
    }),
    paymentType: Joi.string().valid(...Object.values(PaymentTypeProofE)).messages({
        'any.only': `El tipo de pago debe ser igual a uno de los valores permitidos.`
    }),
    exchangeRate: Joi.string().valid(...Object.values(ExchangeRateE)).messages({
        'any.only': `El tipo de cambio debe ser igual a uno de los valores permitidos.`
    }),
    advanceCustomer: Joi.number().required(),
    productId: Joi.number(),
    providerId: Joi.number(),
    conversionAdvance: Joi.number().required(),
    exchangeRateAmount: Joi.number().required(),
    // quotationId: Joi.number().required(),
    images: Joi.array().items(documents).optional(),
})
export const schemaAssembledProducts = Joi.object({
    id: Joi.number(),
    description: Joi.string().required(),
    mainMaterial: Joi.string().required(),
    mainFinish: Joi.string().required(),
    secondaryMaterial: Joi.string().required(),
    secondaryFinishing: Joi.string().required(),
    quantity: Joi.number().positive().message('La cantidad debe ser mayor a 0.').required(),
    document: documents
})

const products = Joi.object({
    productId: Joi.number().required(),
    mainMaterial: Joi.string().required(),
    mainMaterialImg: documents.optional(),
    mainFinish: Joi.string().required(),
    mainFinishImg: documents.optional(),
    secondaryMaterial: Joi.string().required(),
    secondaryMaterialImg: documents.optional(),
    secondaryFinishing: Joi.string().required(),
    secondaryFinishingImag: documents.optional(),
    measureWide: Joi.number().required(),
    measureHigh: Joi.number().required(),
    measureDepth: Joi.number().required(),
    measureCircumference: Joi.number().allow(null),
    weight: Joi.number().required(),
    providerId: Joi.number().required(),
    model: Joi.string().required(),
    originCode: Joi.string().required(),
    originCost: Joi.number().required(),
    currency: Joi.string().valid(...Object.values(CurrencyE)).messages({
        'any.only': `El tipo de cambio debe ser igual a uno de los valores permitidos.`
    }).required(),
    factor: Joi.number().required(),
    price: Joi.number().required(),
    percentageMaximumDiscount: Joi.number().required(),
    maximumDiscount: Joi.number().required(),
    quantity: Joi.number().required(),
    subtotal: Joi.number().required(),
    percentageDiscountProduct: Joi.number().required(),
    discountProduct: Joi.number().required(),
    subtotalDiscount: Joi.number().required(),
    location: Joi.string().allow('').allow(null),
    assembledProducts: Joi.array().items(schemaAssembledProducts).optional().allow(null),
})

const schemaMainProjectManagerCommissions = Joi.object({
    classificationId: Joi.number().required(),
    commissionPercentage: Joi.number().required(),
    id: Joi.number(),
})

const projectManager = Joi.object({
    userId: Joi.number(),
    projectManagerCommissions: Joi.array().items(schemaMainProjectManagerCommissions).optional(),
})

const designer = Joi.object({
    userId: Joi.number(),
    commissionPercentageDesigner: Joi.array().items(schemaMainProjectManagerCommissions).optional(),
})

export const schemaCreateQuotition = Joi.object({
    id: Joi.number().allow(null),
    isDraft: Joi.boolean().required(),
    customer: Joi.object({
        customerId: Joi.number().allow(null),
        name: Joi.string().allow(null).allow(''),
        lastName: Joi.string().allow(null).allow(''),
        secondLastName: Joi.string().allow(null).allow(''),
        address: Joi.object({
            street: Joi.string().allow('').allow(null),
            extNum: Joi.string().allow('').allow(null),
            intNum: Joi.string().allow('').allow(null),
            zipCode: Joi.string().regex(/^[0-9]{5}$/).message('El código postal debe contener 5 dígitos').allow('').allow(null),
            suburb: Joi.string().allow('').allow(null),
            city: Joi.string().allow('').allow(null),
            state: Joi.string().allow('').allow(null),
            country: Joi.string().allow('').allow(null),
        }),
        addressDescription: Joi.string().allow(null).allow(''),
        phone: Joi.string().allow(null).allow(''),
        invoice: Joi.boolean().allow(null),
        rfc: Joi.string().allow(null).allow(''),
        businessName: Joi.string().allow(null).allow(''),
        regimen: Joi.string().allow(null).allow(''),
        groupId: Joi.number().allow(null),
        groupName: Joi.string().allow(null).allow(''),

    }),
    projectManagers: Joi.array().items(projectManager).optional(),
    designers: Joi.array().items(designer).optional(),
    products: Joi.array().items(products).required(),
    quotation: Joi.object({
        mainProjectManagerId: Joi.number().required(),
        mainProjectManagerCommissions: Joi.array().items(schemaMainProjectManagerCommissions).optional(),
        commissionPercentageArchitect: Joi.number().allow(null),
        isArchitect: Joi.boolean().allow(null),
        architectName: Joi.string().allow(null).allow(""),
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
        advanceCustomer: Joi.number().allow(null),
        conversionAdvance: Joi.number().allow(null),
        balance: Joi.number().allow(null),
        exchangeRateQuotation: Joi.string().valid(...Object.values(ExchangeRateQuotationE)).messages({
            'any.only': `El tipo de cambio en la cotizacion debe ser igual a uno de los valores permitidos.`
        }).allow(null),
    }),
    proofPaymentQuotation: Joi.array().items(schemaProofPaymentQuotationQ).optional(),
})


export const schemaUpdateQuotition = Joi.object({
    isDraft: Joi.boolean().required(),
    customer: Joi.object({
        customerId: Joi.number().allow(null),
        name: Joi.string().allow(null).allow(''),
        lastName: Joi.string().allow(null).allow(''),
        secondLastName: Joi.string().allow(null).allow(''),
        address: Joi.object({
            street: Joi.string().allow('').allow(null),
            extNum: Joi.string().allow('').allow(null),
            intNum: Joi.string().allow('').allow(null),
            zipCode: Joi.string().regex(/^[0-9]{5}$/).message('El código postal debe contener 5 dígitos').allow('').allow(null),
            suburb: Joi.string().allow('').allow(null),
            city: Joi.string().allow('').allow(null),
            state: Joi.string().allow('').allow(null),
            country: Joi.string().allow('').allow(null),
        }),
        addressDescription: Joi.string().allow(null).allow(''),
        phone: Joi.string().allow(null).allow(''),
        invoice: Joi.boolean().allow(null),
        rfc: Joi.string().allow(null).allow(''),
        businessName: Joi.string().allow(null).allow(''),
        regimen: Joi.string().allow(null).allow(''),
        groupId: Joi.number().allow(null),
        groupName: Joi.string().allow(null).allow(''),

    }),
    projectManagers: Joi.array().items(projectManager).optional(),
    designers: Joi.array().items(designer).optional(),
    products: Joi.array().items(products).optional(),
    quotation: Joi.object({
        mainProjectManagerId: Joi.number().required(),
        commissionPercentageArchitect: Joi.number().allow(null),
        isArchitect: Joi.boolean().allow(null),
        architectName: Joi.string().allow(null).allow(""),
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
        advanceCustomer: Joi.number().allow(null),
        conversionAdvance: Joi.number().allow(null),
        balance: Joi.number().allow(null),
        exchangeRateQuotation: Joi.string().valid(...Object.values(ExchangeRateQuotationE)).messages({
            'any.only': `El tipo de cambio en la cotizacion debe ser igual a uno de los valores permitidos.`
        }).allow(null),
    }),
    proofPaymentQuotation: Joi.array().items(schemaProofPaymentQuotation).optional(),
})


export const schemaChangeStatusSM = Joi.object({
    isRejected: Joi.boolean().required(),
    isFractionate: Joi.when('isRejected', {is: false, then: Joi.boolean().required()}),
    comment: Joi.when('isRejected', {is: true, then: Joi.string().required()}),

})

export const schemaChangeStatusClose = Joi.object({
    isRejected: Joi.boolean().required(),
    comment: Joi.when('isRejected', {is: true, then: Joi.string().required()}),
})
