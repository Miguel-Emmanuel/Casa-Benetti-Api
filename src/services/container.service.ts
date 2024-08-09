import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {schemaCreateContainer} from '../joi.validation.ts/container.validation';
import {ResponseServiceBindings} from '../keys';
import {Container, ContainerCreate, Document} from '../models';
import {ContainerRepository, DocumentRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ContainerService {
    constructor(
        @repository(ContainerRepository)
        public containerRepository: ContainerRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
    ) { }

    async create(container: Omit<ContainerCreate, 'id'>,) {
        try {
            await this.validateBodyCustomer(container);
            const {docs, ...body} = container
            const containerRes = await this.containerRepository.create(body);
            await this.createDocument(containerRes!.id, docs);
            return containerRes;
        } catch (error) {
            throw this.responseService.badRequest(error?.message ?? error);
        }
    }

    async find(filter?: Filter<Container>,) {
        const containers = await this.containerRepository.find(filter);
        return containers.map(value => {
            const {id, pedimento, containerNumber, invoiceNumber, grossWeight, numberBoxes, measures, ETADate, ETDDate, status} = value;
            return {
                id,
                pedimento,
                containerNumber,
                invoiceNumber,
                grossWeight,
                numberBoxes,
                measures,
                ETADate,
                ETDDate,
                status
            }
        })
    }

    async findById(id: number, filter?: FilterExcludingWhere<Container>) {
        return this.containerRepository.findById(id, filter);
    }

    async updateById(id: number, container: Container,) {
        await this.containerRepository.updateById(id, container);
    }


    async validateBodyCustomer(customer: ContainerCreate) {
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

    async createDocument(containerId?: number, documents?: Document[]) {
        if (documents) {
            for (let index = 0; index < documents?.length; index++) {
                const element = documents[index];
                if (element && !element?.id) {
                    await this.containerRepository.documents(containerId).create(element);
                } else if (element) {
                    await this.documentRepository.updateById(element.id, {...element});
                }
            }
        }
    }
}
