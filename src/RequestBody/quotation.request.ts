import {RequestBodyObject, ResponseModelOrSpec, getModelSchemaRef} from '@loopback/rest';
import {ExchangeRateE} from '../enums';
import {ProofPaymentQuotationCreate, QuotationProductsCreate} from '../models';

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
                    typeQuotation: {
                        type: 'string'
                    },
                    showRoomDestination: {
                        type: 'string',
                        nullable: true
                    },
                    branchesId: {
                        type: 'array',
                        nullable: true,
                        items: {
                            type: 'number'
                        }
                    },
                    isDraft: {
                        type: 'boolean'
                    },
                    //Datos de cotizacion showroom
                    branchId: {
                        type: 'number'
                    },
                    //Datos de cotizacion cliente
                    customer: {
                        type: 'object',
                        properties: {
                            customerId: {
                                type: 'number',
                                nullable: true
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

export const UpdateRequestBody: Partial<RequestBodyObject> = {
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
                            name: {
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
                                discountProduct: {
                                    type: 'number'
                                },
                                percentageAdditionalDiscount: {
                                    type: 'number'
                                },
                                additionalDiscount: {
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


export const QuotationGteByIdResponse: ResponseModelOrSpec = {
    description: 'Quotation model instance',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    customer: {
                        type: 'object',
                        properties: {
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
                                type: 'string'
                            },
                            phone: {
                                type: 'string'
                            },
                            invoice: {
                                type: 'boolean'
                            },
                            rfc: {
                                type: 'string'
                            },
                            businessName: {
                                type: 'string'
                            },
                            regimen: {
                                type: 'string'
                            },
                            group: {
                                type: 'string'
                            },

                        }
                    },
                    products: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                SKU: {
                                    type: 'string'
                                },
                                brandName: {
                                    type: 'string'
                                },
                                status: {
                                    type: 'string'
                                },
                                description: {
                                    type: 'string'
                                },
                                image: {
                                    type: 'string'
                                },
                                mainFinish: {
                                    type: 'string'
                                },
                                sale: {
                                    type: 'string'
                                },
                                quantity: {
                                    type: 'number'
                                },
                                percentageDiscountProduct: {
                                    type: 'number'
                                },
                                discountProduct: {
                                    type: 'number'
                                },
                                percentageAdditionalDiscount: {
                                    type: 'number'
                                },
                                additionalDiscount: {
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
                            advance: {
                                type: 'number'
                            },
                            exchangeRate: {
                                type: 'number'
                            },
                            balance: {
                                type: 'number'
                            },
                        }
                    },
                    commisions: {
                        type: 'object',
                        properties: {
                            architectName: {
                                type: 'string'
                            },
                            commissionPercentageArchitect: {
                                type: 'number'
                            },
                            referencedCustomerName: {
                                type: 'number'
                            },
                            projectManagers: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        projectManagerName: {
                                            type: 'number'
                                        },
                                        classificationPercentageMainpms: {
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
                                        designerName: {
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
                            }
                        }
                    }
                }
            },
        },
    },
}


export const QuotationFindResponseSwagger: ResponseModelOrSpec = {
    description: 'Array of Quotation model instances',
    content: {
        'application/json': {
            schema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number'
                        },
                        customerName: {
                            type: 'string'
                        },
                        pm: {
                            type: 'string'
                        },
                        total: {
                            type: 'number'
                        },
                        branchName: {
                            type: 'string'
                        },
                        status: {
                            type: 'string'
                        },
                        updatedAt: {
                            type: 'string'
                        },
                    }
                },
            },
        },
    },
}
