import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, IsolationLevel, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {schemaActivateDeactivateCustomer, schemaCreateCustomer} from '../joi.validation.ts/customer.validation';
import {ResponseServiceBindings} from '../keys';
import {Customer, CustomerGroup} from '../models';
import {CustomerRepository, GroupRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class CustomerService {
    constructor(
        @repository(CustomerRepository)
        public customerRepository: CustomerRepository,
        @repository(GroupRepository)
        public groupRepository: GroupRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(customer: CustomerGroup) {
        const {groupName, ...newCustomer} = customer;
        await this.validateBodyCustomer(customer);
        const transaction = await this.customerRepository.dataSource.beginTransaction(IsolationLevel.SERIALIZABLE);

        try {
            const groupId = await this.getOrCreateGroup(customer, transaction);
            const customerResp = await this.customerRepository.create({...newCustomer, organizationId: this.user.organizationId, groupId}, {transaction});
            await transaction.commit()
            return customerResp;
        } catch (error) {
            await transaction.rollback();
            throw this.responseService.badRequest(error?.message ?? error)
        }
    }

    async getOrCreateGroup(customer: CustomerGroup, transaction: any) {
        let {groupId, groupName} = customer;
        if (groupId) {
            await this.findByIdGroup(customer.groupId);
        } else if (groupName) {
            const group = await this.createGroup(groupName, transaction);
            groupId = group.id
        }
        return groupId;
    }

    async createGroup(groupName: string, transaction: any) {
        return this.groupRepository.create({name: groupName}, {transaction})
    }

    async findByIdGroup(id: number) {
        const brand = await this.groupRepository.findOne({where: {id}});
        if (!brand)
            throw this.responseService.notFound("El grupo no se ha encontrado.")
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
        const customer = await this.customerRepository.findOne({where: {id}, ...filter});
        if (!customer)
            throw this.responseService.notFound("El cliente no se ha encontrado.")

        return customer
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
        await this.findByIdCustomer(id);
        await this.findByIdGroup(customer.groupId);
        await this.validateBodyCustomer(customer);
        await this.customerRepository.updateById(id, customer);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    }


    async validateBodyCustomer(customer: Customer) {
        try {
            await schemaCreateCustomer.validateAsync(customer);
        }
        catch (err) {
            const {details} = err;
            const {context: {key}, message} = details[0];

            if (message.includes('is required') || message.includes('is not allowed to be empty'))
                throw this.responseService.unprocessableEntity(`${key} es requerido.`)
            throw this.responseService.unprocessableEntity(message)
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
