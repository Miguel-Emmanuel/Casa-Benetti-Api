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
import {ExpenseServiceBindings} from '../keys';
import {Expense} from '../models';
import {ExpenseRepository} from '../repositories';
import {ExpenseService} from '../services/expense.service';

@authenticate('jwt')
export class ExpenseController {
  constructor(
    @repository(ExpenseRepository)
    public expenseRepository: ExpenseRepository,
    @inject(ExpenseServiceBindings.EXPENSE_SERVICE)
    public expenseService: ExpenseService
  ) { }

  @post('/expenses')
  @response(200, {
    description: 'Expense model instance',
    content: {'application/json': {schema: getModelSchemaRef(Expense)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {
            title: 'NewExpense',
            exclude: ["id", "isDeleted", "createdAt", "createdBy", "updatedBy", "updatedAt", "deleteComment"],

          }),
        },
      },
    })
    expense: Expense,
  ): Promise<object> {
    return this.expenseService.create(expense);
  }

  @get('/expenses/count')
  @response(200, {
    description: 'Expense model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Expense) where?: Where<Expense>,
  ): Promise<object> {
    return this.expenseService.count(where);
  }

  @get('/expenses')
  @response(200, {
    description: 'Array of Expense model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Expense, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Expense) filter?: Filter<Expense>,
  ): Promise<object> {
    return this.expenseService.find(filter);
  }

  @get('/expenses/{id}')
  @response(200, {
    description: 'Expense model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Expense, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Expense, {exclude: 'where'}) filter?: FilterExcludingWhere<Expense>
  ): Promise<object> {
    return this.expenseService.findById(id, filter);
  }

  @patch('/expenses/{id}')
  @response(204, {
    description: 'Expense PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Expense, {partial: true}),
        },
      },
    })
    expense: Expense,
  ): Promise<void> {
    await this.expenseService.updateById(id, expense);
  }
}
