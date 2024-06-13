import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Expense} from '../models';
import {ExpenseRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ExpenseService {
  constructor(
    @repository(ExpenseRepository)
    public expenseRepository: ExpenseRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @inject(SecurityBindings.USER)
    private user: UserProfile,
  ) { }

  async create(expense: Expense) {
    try {
      return this.expenseRepository.create({...expense,/* organizationId: this.user.organizationId*/});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async find(filter?: Filter<Expense>) {
    try {
      return this.expenseRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Expense>) {
    try {
      return this.expenseRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Expense>) {
    try {
      return this.expenseRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, expense: Expense,) {
    try {
      await this.expenseRepository.updateById(id, expense);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
