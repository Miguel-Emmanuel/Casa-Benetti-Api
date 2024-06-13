import {RequestBodyObject} from '@loopback/rest';

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
                    client: {
                        type: 'object',
                        properties: {
                            clientId: {
                                type: 'number',
                                nullable: true
                            },
                            firstName: {
                                type: 'string'
                            },
                            lastName: {
                                type: 'string'
                            },
                            secondLastName: {
                                type: 'string'
                            },
                            address: {
                                type: 'object',
                                properties: {
                                    state: {type: 'string'},
                                    city: {type: 'string'},
                                    street: {type: 'string'},
                                    suburb: {type: 'string'},
                                    zipCode: {type: 'string'},
                                    extNum: {type: 'string'},
                                    intNum: {type: 'string'},
                                    country: {type: 'string'}
                                }
                            },
                            addressDescription: {
                                type: 'string'
                            },
                            phone: {
                                type: 'string'
                            },
                            isInvoice: {
                                type: 'boolean'
                            },
                            rfc: {
                                type: 'string'
                            },
                            businessName: {
                                type: 'string'
                            },
                            groupId: {
                                type: 'number'
                            }
                        }
                    },
                    commissions: {
                        type: 'object',
                        properties: {
                            isArchitect: {
                                type: 'boolean'
                            },
                            architectName: {
                                type: 'string'
                            },
                            commissionPercentageArchitect: {
                                type: 'number'
                            },
                            isReferencedCustomer: {
                                type: 'boolean'
                            },
                            commissionPercentagereferencedCustomer: {
                                type: 'number'
                            },
                            referencedClientId: {
                                type: 'number'
                            },
                            isProjectManager: {
                                type: 'boolean'
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
                            isDesigner: {
                                type: 'boolean'
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
                            subtotal: {
                                type: 'number'
                            },
                            percentageAdditionalDiscount: {
                                type: 'number'
                            },
                            additionalDiscount: {
                                type: 'number'
                            },
                            percentageIva: {
                                type: 'number'
                            },
                            iva: {
                                type: 'number'
                            },
                            total: {
                                type: 'number'
                            },
                            percentageAdvance: {
                                type: 'number'
                            },
                            advance: {
                                type: 'number'
                            },
                            exchangeRate: {
                                type: 'string'
                            },
                            balance: {
                                type: 'number'
                            },
                        }
                    }

                }
            }
        },
    },
}
