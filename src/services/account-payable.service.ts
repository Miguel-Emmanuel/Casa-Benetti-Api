import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {AccountPayable} from '../models';
import {AccountPayableRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountPayableService {
  constructor(
    @repository(AccountPayableRepository)
    public accountPayableRepository: AccountPayableRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
  ) { }

  async create(accountPayable: AccountPayable) {
    try {
      return this.accountPayableRepository.create({...accountPayable, });
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
  async find(filter?: Filter<AccountPayable>) {
    try {
      return this.accountPayableRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<AccountPayable>) {
    try {
      return this.accountPayableRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<AccountPayable>) {
    try {
      return this.accountPayableRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, brand: AccountPayable,) {
    try {
      await this.accountPayableRepository.updateById(id, brand);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
