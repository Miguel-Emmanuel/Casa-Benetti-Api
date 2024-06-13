import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  requestBody,
  response
} from '@loopback/rest';
import {GroupServiceBindings} from '../keys';
import {Group} from '../models';
import {GroupRepository} from '../repositories';
import {GroupService} from '../services/group.service';

@authenticate('jwt')
export class GroupController {
  constructor(
    @repository(GroupRepository)
    public groupRepository: GroupRepository,
    @inject(GroupServiceBindings.GROUP_SERVICE)
    public groupService: GroupService
  ) { }

  @post('/groups')
  @response(200, {
    description: 'Group model instance',
    content: {'application/json': {schema: getModelSchemaRef(Group)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {
            title: 'NewGroup',
            exclude: ["id", "isDeleted", "createdAt", "createdBy", "updatedBy", "updatedAt", "deleteComment", "organizationId"],
          }),
        },
      },
    })
    group: Omit<Group, 'id'>,
  ): Promise<object> {
    return this.groupService.create(group);
  }

  @get('/groups/count')
  @response(200, {
    description: 'Group model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Group) where?: Where<Group>,
  ): Promise<object> {
    return this.groupService.count(where);
  }

  @get('/groups')
  @response(200, {
    description: 'Array of Group model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Group, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Group) filter?: Filter<Group>,
  ): Promise<object> {
    return this.groupService.find(filter);
  }

  @get('/groups/{id}')
  @response(200, {
    description: 'Group model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Group, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Group, {exclude: 'where'}) filter?: FilterExcludingWhere<Group>
  ): Promise<object> {
    return this.groupService.findById(id, filter);
  }

  @patch('/groups/{id}')
  @response(204, {
    description: 'Group PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Group, {partial: true}),
        },
      },
    })
    group: Group,
  ): Promise<void> {
    await this.groupService.updateById(id, group);
  }
}
