import {RequestBodyObject} from '@loopback/rest';
import {ExchangeRateE} from '../enums';

export const CreateRequestBody: Partial<RequestBodyObject> = {
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    id: {
                        type: 'number',
                        nullable: true
                    },
                    isDraft: {
                        type: 'boolean'
                    },
                    customer: {
                        type: 'object',
                        properties: {
                            customerId: {
                                type: 'number',
                                nullable: true
                            },
                            firstName: {
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
                            isInvoice: {
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
                            groupId: {
                                type: 'number',
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
                                commissionPercentageProjectManager: {
                                    type: 'number'
                                }
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
                                    type: 'number'
                                }
                            }
                        }
                    },
                    products: {
                        type: 'array',
                        items: {
                            properties: {
                                productId: {
                                    type: 'number'
                                },
                                typeSale: {
                                    type: 'string'
                                },
                                isSeparate: {
                                    type: 'boolean'
                                },
                                percentageSeparate: {
                                    type: 'number'
                                },
                                reservationDays: {
                                    type: 'number'
                                },
                                provedorId: {
                                    type: 'number'
                                },
                                quantity: {
                                    type: 'number'
                                },
                                percentageDiscountProduct: {
                                    type: 'number'
                                },
                                percentageAdditionalDiscount: {
                                    type: 'number'
                                },
                                subtotal: {
                                    type: 'number'
                                },
                            }
                        }
                    },
                    quotation: {
                        type: 'object',
                        properties: {
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
                            balance: {
                                type: 'number',
                                nullable: true
                            },
                        }
                    }

                }
            }
        },
    },
}
