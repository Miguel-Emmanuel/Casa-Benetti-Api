import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {schemaActivateDeactivateCustomer} from '../joi.validation.ts/customer.validation';
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
            return this.customerRepository.create({...customer, organizationId: this.user.organizationId});
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

    async findByIdCustomer(id: number) {
        const customer = await this.customerRepository.findOne({where: {id}});
        if (!customer)
            throw this.responseService.notFound("El cliente no se ha encontrado.")
        return customer
    }

    async activateDeactivate(id: number, body: {activateDeactivateComment: string},) {
        const product = await this.findByIdCustomer(id);
        await this.validateBodyActivateDeactivate(body);
        await this.customerRepository.updateById(id, {isActive: !product?.isActive, activateDeactivateComment: body.activateDeactivateComment});
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }

    async validateBodyActivateDeactivate(body: {activateDeactivateComment: string},) {
        try {
            await schemaActivateDeactivateCustomer.validateAsync(body);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];
            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)

            throw this.responseService.unprocessableEntity(message)
        }
    }
}
