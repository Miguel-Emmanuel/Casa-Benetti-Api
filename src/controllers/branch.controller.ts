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
  post,
  requestBody,
  response
} from '@loopback/rest';
import {BranchServiceBindings} from '../keys';
import {Branch} from '../models';
import {BranchRepository} from '../repositories';
import {BranchService} from '../services/branch.service';

@authenticate('jwt')
export class BranchController {
  constructor(
    @repository(BranchRepository)
    public branchRepository: BranchRepository,
    @inject(BranchServiceBindings.BRANCH_SERVICE)
    public branchService: BranchService
  ) { }

  @post('/branches')
  @response(200, {
    description: 'Branch model instance',
    content: {'application/json': {schema: getModelSchemaRef(Branch)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Branch, {
            title: 'NewBranch',
            exclude: ['id'],
          }),
        },
      },
    })
    branch: Omit<Branch, 'id'>,
  ): Promise<Branch> {
    return this.branchRepository.create(branch);
  }

  @get('/branches/count')
  @response(200, {
    description: 'Branch model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Branch) where?: Where<Branch>,
  ): Promise<object> {
    return this.branchService.count(where);
  }

  @get('/branches')
  @response(200, {
    description: 'Array of Branch model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Branch, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Branch) filter?: Filter<Branch>,
  ): Promise<object> {
    return this.branchService.find(filter);
  }

  @get('/branches/{id}')
  @response(200, {
    description: 'Branch model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Branch, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Branch, {exclude: 'where'}) filter?: FilterExcludingWhere<Branch>
  ): Promise<object> {
    return this.branchService.findById(id, filter);
  }

  // @patch('/branches/{id}')
  // @response(204, {
  //   description: 'Branch PATCH success',
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Branch, {partial: true}),
  //       },
  //     },
  //   })
  //   branch: Branch,
  // ): Promise<void> {
  //   await this.branchRepository.updateById(id, branch);
  // }
}
