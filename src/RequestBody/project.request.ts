import {getModelSchemaRef, RequestBodyObject} from '@loopback/rest';
import {ExchangeRateE} from '../enums';
import {ProofPaymentQuotationCreate, QuotationProductsCreate} from '../models';

export const UpdateQuotationProjectBody: Partial<RequestBodyObject> = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                    },
                    typeQuotation: {
                        type: 'string'
                    },
                    customer: {
                        type: 'object',
                        properties: {
                            customerId: {
                                type: 'number',
                            },
                            name: {
                                type: 'string',
                                nullable: true
                            },
                            email: {
                                type: 'string',
                                nullable: true
                            },
                            lastName: {
                                type: 'string',
                                nullable: true
                            },
                            secondLastName: {
                                type: 'string',
                                nullable: true
                            },
                            address: {
                                type: 'object',
                                properties: {
                                    state: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    city: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    street: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    suburb: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    zipCode: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    extNum: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    intNum: {
                                        type: 'string',
                                        nullable: true
                                    },
                                    country: {
                                        type: 'string',
                                        nullable: true
                                    }
                                }
                            },
                            addressDescription: {
                                type: 'string',
                                nullable: true
                            },
                            phone: {
                                type: 'string',
                                nullable: true
                            },
                            invoice: {
                                type: 'boolean',
                                nullable: true
                            },
                            rfc: {
                                type: 'string',
                                nullable: true
                            },
                            businessName: {
                                type: 'string',
                                nullable: true
                            },
                            regimen: {
                                type: 'string',
                                nullable: true
                            },
                            groupId: {
                                type: 'number',
                                nullable: true
                            },
                            groupName: {
                                type: 'string',
                                nullable: true
                            }
                        }
                    },
                    projectManagers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                userId: {
                                    type: 'number'
                                },
                                projectManagerCommissions: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            classificationId: {
                                                type: 'number'
                                            },
                                            commissionPercentage: {
                                                type: 'number'
                                            },
                                            id: {
                                                type: 'number'
                                            },

                                        }
                                    }
                                },
                            }
                        }
                    },
                    designers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                userId: {
                                    type: 'number'
                                },
                                commissionPercentageDesigner: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            classificationId: {
                                                type: 'number'
                                            },
                                            commissionPercentage: {
                                                type: 'number'
                                            },
                                            id: {
                                                type: 'number'
                                            },
                                        }
                                    }
                                },
                            }
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
                            mainProjectManagerId: {
                                type: 'number',
                            },
                            mainProjectManagerCommissions: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        classificationId: {
                                            type: 'number'
                                        },
                                        commissionPercentage: {
                                            type: 'number'
                                        },
                                        id: {
                                            type: 'number'
                                        },
                                    }
                                }
                            },
                            referenceCustomerId: {
                                type: 'number',
                                nullable: true
                            },
                            isArchitect: {
                                type: 'boolean',
                                nullable: true
                            },
                            architectName: {
                                type: 'string',
                                nullable: true
                            },
                            commissionPercentageArchitect: {
                                type: 'number',
                                nullable: true
                            },
                            isReferencedCustomer: {
                                type: 'boolean',
                                nullable: true
                            },
                            commissionPercentagereferencedCustomer: {
                                type: 'number',
                                nullable: true
                            },
                            isProjectManager: {
                                type: 'boolean',
                                nullable: true
                            },
                            isDesigner: {
                                type: 'boolean',
                                nullable: true
                            },
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
                        }
                    },
                    proofPaymentQuotation: {
                        type: 'array',
                        items: getModelSchemaRef(ProofPaymentQuotationCreate, {exclude: ['createdAt', 'quotationId']})
                    }
                }
            }
        },
    },
}
