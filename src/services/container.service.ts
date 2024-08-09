import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {schemaCreateContainer} from '../joi.validation.ts/container.validation';
import {ResponseServiceBindings} from '../keys';
import {Container} from '../models';
import {ContainerRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ContainerService {
    constructor(
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }

    async create(container: Omit<Container, 'id'>,) {
        return this.containerRepository.create(container);
    }

    async find(filter?: Filter<Container>,) {
        return this.containerRepository.find(filter);
    }

    async findById(id: number, filter?: FilterExcludingWhere<Container>) {
        return this.containerRepository.findById(id, filter);
    }

    async updateById(id: number, container: Container,) {
        await this.containerRepository.updateById(id, container);
    }


    async validateBodyCustomer(customer: Container) {
        try {
            await schemaCreateContainer.validateAsync(customer);
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
