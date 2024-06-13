import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Customer} from '../models';
import {CustomerRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CustomerService {
  constructor(
    @repository(CustomerRepository)
    public customerRepository: CustomerRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @inject(SecurityBindings.USER)
    private user: UserProfile,
  ) { }

  async create(customer: Customer) {
    try {
      return this.customerRepository.create({...customer, /*organizationId: this.user.organizationId*/});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async find(filter?: Filter<Customer>) {
    try {
      return this.customerRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Customer>) {
    try {
      return this.customerRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Customer>) {
    try {
      return this.customerRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, customer: Customer,) {
    try {
      await this.customerRepository.updateById(id, customer);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
