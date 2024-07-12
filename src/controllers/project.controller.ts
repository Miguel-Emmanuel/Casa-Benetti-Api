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
    get,
    getModelSchemaRef,
    param,
    patch,
    requestBody,
    response
} from '@loopback/rest';
import {Project} from '../models';
import {ProjectService} from '../services';

@authenticate('jwt')
export class ProjectController {
    constructor(
        @service()
        public projectService: ProjectService,
    ) { }

    // @post('/projects')
    // @response(200, {
    //     description: 'Project model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(Project)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(Project, {
    //                     title: 'NewProject',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     project: Omit<Project, 'id'>,
    // ): Promise<Project> {
    //     return this.projectRepository.create(project);
    // }

    @get('/projects/count')
    @response(200, {
        description: 'Project model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Project) where?: Where<Project>,
    ): Promise<Count> {
        return this.projectService.count(where);
    }

    @get('/projects')
    @response(200, {
        description: 'Array of Project model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Project),
                },
            },
        },
    })
    async find(
        @param.filter(Project) filter?: Filter<Project>,
    ): Promise<Object[]> {
        return this.projectService.find(filter);
    }

    @get('/projects/{id}')
    @response(200, {
        description: 'Project model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Project,),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Project, {exclude: 'where'}) filter?: FilterExcludingWhere<Project>
    ): Promise<Object> {
        return this.projectService.findById(id, filter);
    }

    @get('/projects/{id}/products')
    @response(200, {
        description: 'Project model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'number'
                        },
                        provider: {
                            type: 'string'
                        },
                        SKU: {
                            type: 'string'
                        },
                        name: {
                            type: 'string'
                        },
                        brand: {
                            type: 'string'
                        },
                        prices: {
                            type: 'string'
                        },
                        description: {
                            type: 'string'
                        },
                    }
                }
            },
        },
    })
    async getProducts(
        @param.path.number('id') id: number,
    ): Promise<any> {
        return this.projectService.getProducts(id);
    }

    @patch('/projects/{id}')
    @response(204, {
        description: 'Project PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Project, {partial: true}),
                },
            },
        })
        project: Project,
    ): Promise<void> {
        await this.projectService.updateById(id, project);
    }

    @get('/projects/documents/{id}')
    @response(200, {
        description: 'Project model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        clientQuoteFile: {
                            type: 'object',
                            properties: {
                                fileURL: {
                                    type: 'string'
                                },
                                name: {
                                    type: 'string'
                                },
                                createdAt: {
                                    type: 'string', format: 'date-time'
                                },
                            }
                        },
                        providerFile: {
                            type: 'object',
                            properties: {
                                fileURL: {
                                    type: 'string'
                                },
                                name: {
                                    type: 'string'
                                },
                                createdAt: {
                                    type: 'string', format: 'date-time'
                                },
                            }
                        },
                        advanceFile: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    fileURL: {
                                        type: 'string'
                                    },
                                    name: {
                                        type: 'string'
                                    },
                                    createdAt: {
                                        type: 'string', format: 'date-time'
                                    },
                                }
                            }
                        },
                        documents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    fileURL: {
                                        type: 'string'
                                    },
                                    name: {
                                        type: 'string'
                                    },
                                    createdAt: {
                                        type: 'string', format: 'date-time'
                                    },
                                }
                            }
                        }
                    }
                }
            },
        },
    })
    async getDocuments(
        @param.path.number('id') id: number,
    ): Promise<Object> {
        return this.projectService.getDocuments(id);
    }

    @patch('/projects/documents/{id}')
    @response(201, {
        description: 'customer model instance',
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
    async uploadDocuments(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            document: {
                                type: 'array',
                                items: {
                                    properties: {
                                        id: {type: 'number'},
                                        fileURL: {type: 'string'},
                                        name: {type: 'string'},
                                        extension: {type: 'string'}
                                    }
                                }
                            }
                        }
                    }
                },
            },
        })
        data: {document: {fileURL: string, name: string, extension: string, id?: number}[]},
    ): Promise<void> {
        await this.projectService.uploadDocuments(id, data);
    }

    // @del('/projects/{id}')
    // @response(204, {
    //     description: 'Project DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.projectRepository.deleteById(id);
    // }
}
