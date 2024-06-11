import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, requestBody} from '@loopback/rest';
import {ResponseServiceBindings, RoleBindings, UserServiceBindings} from '../keys';

import {Role, RoleModule} from '../models';
import {OrganizationRepository, RoleModuleRepository, RoleRepository, UserDataRepository, UserRepository} from '../repositories';
import {MyUserService, ResponseService, RoleService} from '../services';

@authenticate('jwt')
export class RoleController {
  constructor(
    @repository(RoleRepository)
    public RoleRepository: RoleRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @repository(OrganizationRepository)
    public organizationRepository: OrganizationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(RoleModuleRepository)
    public roleModuleRepository: RoleModuleRepository,
    @repository(UserDataRepository)
    public userDataRepository: UserDataRepository,
    @inject(RoleBindings.ROLE_SERVICE)
    public roleService: RoleService,
  ) { }

  @post('roles', {
    responses: {
      '200': {
        description: 'Role model instance',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                description: {type: 'string'},
                accessLevel: {type: 'string'},
                isActive: {type: 'boolean'},
                roleModules: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      create: {type: 'boolean'},
                      read: {type: 'boolean'},
                      update: {type: 'boolean'},
                      del: {type: 'boolean'},
                      moduleId: {type: 'number'}
                    }
                  }
                },
              }
            }
          }
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              description: {type: 'string'},
              accessLevel: {type: 'string'},
              isActive: {type: 'boolean'},
              roleModules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    create: {type: 'boolean'},
                    read: {type: 'boolean'},
                    update: {type: 'boolean'},
                    del: {type: 'boolean'},
                    moduleId: {type: 'number'}
                  }
                }
              },
            }
          }
        },
      },
    })
    role: any,
    @param.header.string('authorization') token: string
  ): Promise<Object> {
    return this.roleService.create(role, token)
  }

  @post('/roles/activate-deactivate/{id}', {
    responses: {
      '200': {
        description: 'User Roles Activate/Deactivate success',
      },
    },
  })
  async deactivateById(
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
    @param.header.string('authorization') token: string): Promise<object> {
    return this.roleService.deactivateById(id, body, token);
  }

  @get('roles/count', {
    responses: {
      '200': {
        description: 'Role model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.header.string('authorization') token: string, @param.where(Role) where?: Where<Role>): Promise<Count> {
    const user = this.userService.getTokenData(token);
    where = {...where, organizationId: user.organizationId, isDeleted: false};
    return this.RoleRepository.count(where);
  }

  @get('roles', {
    responses: {
      '200': {
        description: 'Array of Role model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Role, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(@param.header.string('authorization') token: string, @param.filter(Role) filter?: Filter<Role>): Promise<Role[]> {
    return this.roleService.find(token, filter)
  }

  @del('roles/{id}', {
    responses: {
      '204': {
        description: 'Role DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    return this.roleService.deleteById(id)
  }

  @get('roles/{id}', {
    responses: {
      '200': {
        description: 'Role model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Role, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.header.string('authorization') token: string,
    @param.filter(Role, {exclude: 'where'})
    filter?: FilterExcludingWhere<Role>
  ): Promise<object> {
    return this.roleService.findById(id, token, filter);
  }

  @patch('roles/{id}', {
    responses: {
      '204': {
        description: 'Role PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              description: {type: 'string'},
              accessLevel: {type: 'string'},
              isActive: {type: 'boolean'},
              organizationId: {type: 'number'},
              roleModules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {type: 'number'},
                    create: {type: 'boolean'},
                    read: {type: 'boolean'},
                    update: {type: 'boolean'},
                    del: {type: 'boolean'},
                    moduleId: {type: 'number'},
                  }
                }
              },
            }
          },
        },
      },
    })
    role: Role,
    @param.header.string('authorization') token: string
  ): Promise<object> {
    return this.roleService.updateById(id, token, role)
  }

  @get('roles/{id}/role-module', {
    responses: {
      '200': {
        description: 'RoleModule belonging to Role',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(RoleModule)},
          },
        },
      },
    },
  })
  async getRoleModule(
    @param.path.string('id') id: typeof Role.prototype.id,
    @param.header.string('authorization') token: string,
  ): Promise<object> {
    return this.roleService.getRoleModule(id, token)
  }
}
