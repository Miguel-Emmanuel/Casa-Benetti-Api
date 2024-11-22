import {getModelSchemaRef, RequestBodyObject} from '@loopback/rest';
import {ExchangeRateE} from '../enums';
import {QuotationProductsCreate} from '../models';

export const UpdateQuotationProjectBody: Partial<RequestBodyObject> = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    typeQuotation: {
                        type: 'string'
                    },
                    // showRoomDestination: {
                    //     type: 'string',
                    //     nullable: true
                    // },
                    branchesId: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'number'
                        }
                    },
                    products: {
                        type: 'array',
                        items: getModelSchemaRef(QuotationProductsCreate, {exclude: ['id', 'createdAt', 'status', 'quotationId', 'SKU', 'brandId', 'proformaId', 'dateReservationDays', 'isNotificationSent', 'stock', 'invoiceNumber', 'grossWeight', 'netWeight', 'numberBoxes', 'descriptionPedimiento', 'NOMS', 'proformaPrice', 'commentEntry', 'typeQuotation']})
                    },
                    productsStock: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'number'
                                },
                                typeSale: {
                                    type: 'string'
                                },
                                reservationDays: {
                                    type: 'number'
                                },
                                loanInitialDate: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                loanEndDate: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                discountProduct: {
                                    type: 'number'
                                },
                                quantity: {
                                    type: 'number'
                                },
                                originCost: {
                                    type: 'number'
                                },
                                factor: {
                                    type: 'number'
                                },
                                price: {
                                    type: 'number'
                                },
                                subtotal: {
                                    type: 'number'
                                },
                                percentageDiscountProduct: {
                                    type: 'number'
                                },
                                subtotalDiscount: {
                                    type: 'number'
                                },

                            }
                        }
                    },
                    quotation: {
                        type: 'object',
                        properties: {
                            subtotal: {
                                type: 'number',
                                nullable: true
                            },
                            percentageAdditionalDiscount: {
                                type: 'number',
                                nullable: true
                            },
                            additionalDiscount: {
                                type: 'number',
                                nullable: true
                            },
                            percentageIva: {
                                type: 'number',
                                nullable: true
                            },
                            iva: {
                                type: 'number',
                                nullable: true
                            },
                            total: {
                                type: 'number',
                                nullable: true
                            },
                            percentageAdvance: {
                                type: 'number',
                                nullable: true
                            },
                            advance: {
                                type: 'number',
                                nullable: true
                            },
                            exchangeRate: {
                                type: 'string',
                                nullable: true,
                                enum: [...Object.values(ExchangeRateE)]
                            },
                            advanceCustomer: {
                                type: 'number',
                                nullable: true
                            },
                            conversionAdvance: {
                                type: 'number',
                                nullable: true
                            },
                            balance: {
                                type: 'number',
                                nullable: true
                            },
                            exchangeRateQuotation: {
                                type: 'string',
                                nullable: true
                            },
                        }
                    },
                }
            }
        },
    },
}
