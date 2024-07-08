import {authenticate, TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, requestBody, response, Response, RestBindings} from '@loopback/rest';
import {TypeUserE} from '../enums';
import {PasswordHasherBindings, ResponseServiceBindings, SendgridServiceBindings, UserServiceBindings} from '../keys';
import {User, UserData} from '../models';
import {OrganizationRepository, RoleModuleRepository, RoleRepository, UserDataRepository, UserRepository} from '../repositories';
import {BcryptHasher, MyUserService, ResponseService} from '../services';
import {SendgridService} from '../services/sendgrid.service';

@authenticate('jwt')
export class UserController {
    constructor(
        @repository(UserRepository)
        public userRepository: UserRepository,
        @repository(UserDataRepository)
        public userDataRepository: UserDataRepository,
        @inject(RestBindings.Http.RESPONSE)
        protected response: Response,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @inject(PasswordHasherBindings.PASSWORD_HASHER)
        public hasher: BcryptHasher,
        @inject(UserServiceBindings.USER_SERVICE)
        public userService: MyUserService,
        @repository(OrganizationRepository)
        public organizationRepository: OrganizationRepository,
        @inject(TokenServiceBindings.TOKEN_SERVICE)
        public jwtService: TokenService,
        @repository(RoleModuleRepository)
        public roleModuleRepository: RoleModuleRepository,
        @repository(RoleRepository)
        public roleRepository: RoleRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService
    ) { }

    @post('/users', {
        responses: {
            '200': {
                description: 'User model instance',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        email: {type: 'string'},
                                        branchId: {type: 'number'},
                                        firstName: {type: 'string'},
                                        lastName: {type: 'string'},
                                        avatar: {type: 'string'},
                                        isAdmin: {type: 'boolean', nullable: true},
                                        roleId: {type: 'number'},
                                        isProjectManager: {type: 'boolean'},
                                        isShowroomManager: {type: 'boolean'},
                                        isDesigner: {type: 'boolean'},
                                    }
                                },
                                userData: {
                                    type: 'object',
                                    properties: {
                                        birthdate: {type: 'string', format: 'date-time'},
                                        cellphone: {type: 'string'},
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
    })
    async createNewUser(
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            user: {
                                type: 'object',
                                properties: {
                                    email: {type: 'string', format: 'email'},
                                    branchId: {type: 'number'},
                                    firstName: {type: 'string'},
                                    lastName: {type: 'string'},
                                    avatar: {type: 'string'},
                                    isAdmin: {type: 'boolean', nullable: true},
                                    roleId: {type: 'number'},
                                    immediateBossId: {type: 'number'},
                                    isMaster: {type: 'boolean'},
                                    typeUser: {type: 'string', enum: [...Object.values(TypeUserE)], },
                                    isProjectManager: {type: 'boolean'},
                                    isShowroomManager: {type: 'boolean'},
                                    isDesigner: {type: 'boolean'},
                                }
                            },
                            userData: {
                                type: 'object',
                                properties: {
                                    birthdate: {type: 'string', format: 'date-time'},
                                    cellphone: {
                                        type: 'string', minLength: 10,
                                        maxLength: 10,
                                        errorMessage: {
                                            minLength: 'Name should be at least 10 characters.',
                                            maxLength: 'Name should not exceed 10 characters.',
                                        }
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
                                }
                            }
                        }
                    }
                },
            },
        })
        body: {user: User, userData: UserData},
        @param.header.string('authorization') token: string
    ): Promise<Object> {
        return this.userService.create(body, token)
    }

    @del('users/{id}', {
        responses: {
            '204': {
                description: 'User DELETE success',
            },
        },
    })
    async deleteByIdUser(@param.path.number('id') id: number): Promise<Object> {
        return this.userService.deleteByIdUser(id)
    }

    @patch('/users/{id}', {
        responses: {
            '200': {
                description: 'User model instance',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        email: {type: 'string'},
                                        organizationId: {type: 'number'},
                                        firstName: {type: 'string'},
                                        lastName: {type: 'string'},
                                        avatar: {type: 'string'},
                                        isAdmin: {type: 'boolean', nullable: true},
                                        roleId: {type: 'number'},
                                        isProjectManager: {type: 'boolean'},
                                        isShowroomManager: {type: 'boolean'},
                                        isDesigner: {type: 'boolean'},
                                    }
                                },
                                userData: {
                                    type: 'object',
                                    properties: {
                                        birthdate: {type: 'string', format: 'date-time'},
                                        cellphone: {type: 'string'},
                                    }
                                }
                            }
                        }
                    },
                },
            },
        },
    })
    async editSystemUser(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            user: {
                                type: 'object',
                                properties: {
                                    email: {type: 'string'},
                                    organizationId: {type: 'number'},
                                    firstName: {type: 'string'},
                                    lastName: {type: 'string'},
                                    avatar: {type: 'string'},
                                    isAdmin: {type: 'boolean', nullable: true},
                                    roleId: {type: 'number'},
                                    isProjectManager: {type: 'boolean'},
                                    isShowroomManager: {type: 'boolean'},
                                    isDesigner: {type: 'boolean'},
                                }
                            },
                            userData: {
                                type: 'object',
                                properties: {
                                    birthdate: {type: 'string', format: 'date-time'},
                                    cellphone: {type: 'string'},
                                }
                            }
                        }
                    }
                },
            },
        })
        body: {user: User, userData: UserData},
        @param.header.string('authorization') token: string
    ): Promise<Object> {
        return this.userService.editUser(id, body, token)
    }

    @get('/users/count', {
        responses: {
            '200': {
                description: 'User model count',
                content: {'application/json': {schema: CountSchema}},
            },
        },
    })
    async count(
        @param.header.string('authorization') token: string,
        @param.where(User) where?: Where<User>,
    ): Promise<Count> {
        return this.userService.count(token, where)
    }
    validateOrganizationIdToken(organizationId: number) {
        if (!organizationId)
            return this.responseService.unauthorized('Error verificando organization')
    }


    @get('/users', {
        responses: {
            '200': {
                description: 'Array of User model instances',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: getModelSchemaRef(User, {includeRelations: true}),
                        },
                    },
                },
            },
        },
    })
    async find(@param.header.string('authorization') token: string, @param.filter(User) filter?: Filter<User>): Promise<User[]> {
        return this.userService.find(token, filter)
    }

    @get('/users/role', {
        responses: {
            '200': {
                description: 'Array of User model instances',
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: getModelSchemaRef(User, {includeRelations: true}),
                        },
                    },
                },
            },
        },
    })
    async findUsersFilterRole(@param.header.string('authorization') token: string, @param.filter(User) filter?: Filter<User>): Promise<any[]> {
        return this.userService.findUsersFilterRole(token)
    }

    async validateIfOrganizationIsActiveAndExist(organizationId: number) {
        const organization = await this.organizationRepository.findOne({where: {id: organizationId, isActive: true}})
        if (!organization)
            return this.responseService.badRequest('¡Oh, no! La organización no es válida o está desactivada, revisa por favor e intenta de nuevo.');
    }


    @get('/users/{id}', {
        responses: {
            '200': {
                description: 'User model instance',
                content: {
                    'application/json': {
                        schema: getModelSchemaRef(User, {includeRelations: true}),
                    },
                },
            },
        },
    })
    async findById(
        @param.path.string('id') id: number,
        @param.header.string('authorization') token: string,
        @param.filter(User, {exclude: 'where'})
        filter?: FilterExcludingWhere<User>
    ): Promise<User> {
        return this.userService.findById(id, token, filter)
    }

    @get('/users/{id}/user-data', {
        responses: {
            '200': {
                description: 'SysUserData belonging to User',
                content: {
                    'application/json': {
                        schema: {type: 'array', items: getModelSchemaRef(UserData)},
                    },
                },
            },
        },
    })
    async getSysUserData(
        @param.path.string('id') id: typeof User.prototype.id,
        @param.header.string('authorization') token: string,
    ): Promise<UserData> {
        return this.userService.getSysUserData(id, token)
    }


    @post('/users/user-by-token', {
        responses: {
            '200': {
                description: 'Find User By Token'
            },
        },
    })
    async findByToken(
        @param.header.string('authorization') token: string
    ): Promise<object> {
        return this.userService.findByToken(token)
    }

    @post('/users/deactivate-activate/{id}', {
        responses: {
            '200': {
                description: 'User model instance',
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
            },
        },
    })
    @response(204, {
        description: 'User active or deactive',
    })
    async deleteById(
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
        @param.header.string('authorization') token: string
    ): Promise<object> {
        return this.userService.deleteById(body, token, id);
    }

}
