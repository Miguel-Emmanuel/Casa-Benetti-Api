import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    Where
} from '@loopback/repository';
import {
    del,
    get,
    getModelSchemaRef,
    param,
    patch,
    post,
    requestBody,
    response
} from '@loopback/rest';
import {AssembledProducts, Document, Product} from '../models';
import {ProductService} from '../services';

@authenticate('jwt')
export class ProductController {
    constructor(
        @service()
        public productService: ProductService
    ) { }

    @post('/products')
    @response(200, {
        description: 'Product model instance',
        content: {'application/json': {schema: getModelSchemaRef(Product)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            product: getModelSchemaRef(Product, {
                                title: 'NewProduct',
                                exclude: ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment', 'status', 'organizationId', 'isActive', 'activateDeactivateComment'],
                            }),
                            assembledProducts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        assembledProduct: getModelSchemaRef(AssembledProducts, {
                                            title: 'AssembledProducts',
                                            exclude: ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment', 'productId'],
                                        }),
                                        document: {
                                            type: 'object',
                                            nullable: true,
                                            properties: {
                                                fileURL: {type: 'string'},
                                                name: {type: 'string'},
                                                extension: {type: 'string'}
                                            }
                                        }
                                    }
                                }
                            },
                            document: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            mainMaterialImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            mainFinishImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            secondaryMaterialImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            secondaryFinishingImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                        }
                    },
                },
            },
        })
        data: {
            product: Omit<Product, 'id'>,
            document: Document,
            assembledProducts: {assembledProduct: AssembledProducts, document: Document}[],
            mainMaterialImage: Document,
            mainFinishImage: Document,
            secondaryMaterialImage: Document,
            secondaryFinishingImage: Document,
        },
    ): Promise<Product> {
        return this.productService.create(data);
    }

    @get('/products/count')
    @response(200, {
        description: 'Product model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Product) where?: Where<Product>,
    ): Promise<Count> {
        return this.productService.count(where);
    }

    @get('/products')
    @response(200, {
        description: 'Array of Product model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Product, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Product) filter?: Filter<Product>,
    ): Promise<Product[]> {
        return this.productService.find(filter);
    }


    @get('/products/{id}')
    @response(200, {
        description: 'Product model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Product, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Product, {exclude: 'where'}) filter?: FilterExcludingWhere<Product>
    ): Promise<Product> {
        return this.productService.findById(id, filter);
    }

    @patch('/products/{id}')
    @response(204, {
        description: 'Product PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            product: getModelSchemaRef(Product, {
                                title: 'NewProduct',
                                exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment', 'status', 'organizationId', 'isActive', 'activateDeactivateComment'],
                            }),
                            assembledProducts: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        assembledProduct: getModelSchemaRef(AssembledProducts, {
                                            title: 'AssembledProductsUpdate',
                                            exclude: ['createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'isDeleted', 'deleteComment', 'productId'],
                                        }),
                                        document: {
                                            type: 'object',
                                            nullable: true,
                                            properties: {
                                                id: {type: 'number'},
                                                fileURL: {type: 'string'},
                                                name: {type: 'string'},
                                                extension: {type: 'string'}
                                            }
                                        }
                                    }
                                }
                            },
                            document: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: {type: 'number'},
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            mainMaterialImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: {type: 'number'},
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            mainFinishImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: {type: 'number'},
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            secondaryMaterialImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: {type: 'number'},
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                            secondaryFinishingImage: {
                                type: 'object',
                                nullable: true,
                                properties: {
                                    id: {type: 'number'},
                                    fileURL: {type: 'string'},
                                    name: {type: 'string'},
                                    extension: {type: 'string'}
                                }
                            },
                        }
                    },
                },
            },
        })
        data: {
            product: Omit<Product, 'id'>,
            document: Document,
            assembledProducts: {assembledProduct: AssembledProducts, document: Document}[],
            mainMaterialImage: Document,
            mainFinishImage: Document,
            secondaryMaterialImage: Document,
            secondaryFinishingImage: Document,
        },
    ): Promise<void> {
        await this.productService.updateById(id, data);
    }


    @del('/products/{id}')
    @response(204, {
        description: 'Product DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.productService.deleteById(id);
    }

    @patch('/products/activate-deactivate/{id}')
    @response(200, {
        description: 'AssembledProducts model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {type: 'string', example: 'En hora buena! La acción se ha realizado con éxito'}
                    }
                }
            },
        },
    })
    async activateDeactivate(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            activateDeactivateComment: {type: 'string'}
                        }
                    },
                },
            },
        })
        body: {activateDeactivateComment: string},
    ): Promise<object> {
        return this.productService.activateDeactivate(id, body);
    }
}
