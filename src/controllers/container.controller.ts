import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere
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
import {Container, ContainerCreate} from '../models';
import {ContainerService} from '../services';

@authenticate('jwt')
export class ContainerController {
    constructor(
        @service()
        public containerService: ContainerService
    ) { }

    @post('/containers')
    @response(200, {
        description: 'Container model instance',
        content: {'application/json': {schema: getModelSchemaRef(Container)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(ContainerCreate, {
                        title: 'NewContainer',
                        exclude: ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isDeleted', 'deleteComment', 'status'],
                    }),
                },
            },
        })
        container: Omit<ContainerCreate, 'id'>,
    ): Promise<Container> {
        return this.containerService.create(container);
    }

    @get('/containers')
    @response(200, {
        description: 'Array of Container model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Container, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Container) filter?: Filter<Container>,
    ): Promise<Object[]> {
        return this.containerService.find(filter);
    }

    @get('/containers/{id}')
    @response(200, {
        description: 'Container model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Container, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Container, {exclude: 'where'}) filter?: FilterExcludingWhere<Container>
    ): Promise<Object> {
        return this.containerService.findById(id, filter);
    }

    @patch('/containers/{id}')
    @response(204, {
        description: 'Container PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Container, {
                        partial: true,
                        exclude: ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'isDeleted', 'deleteComment', 'status'],
                    }),
                },
            },
        })
        container: Container,
    ): Promise<void> {
        await this.containerService.updateById(id, container);
    }

    // @del('/containers/{id}')
    // @response(204, {
    //     description: 'Container DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.containerService.deleteById(id);
    // }
}
