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
import {CustomerServiceBindings} from '../keys';
import {Customer} from '../models';
import {CustomerRepository} from '../repositories';
import {CustomerService} from '../services';

@authenticate('jwt')
export class CustomerController {
    constructor(
        @repository(CustomerRepository)
        public customerRepository: CustomerRepository,
        @inject(CustomerServiceBindings.CUSTOMER_SERVICE)
        public customerService: CustomerService
    ) { }

    @post('/customers')
    @response(200, {
        description: 'Customer model instance',
        content: {'application/json': {schema: getModelSchemaRef(Customer)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Customer, {
                        title: 'NewCustomer',
                        exclude: ["id", "isDeleted", "createdAt", "createdBy", "updatedBy", "updatedAt", "deleteComment", "organizationId"],
                    }),
                },
            },
        })
        customer: Omit<Customer, 'id'>,
    ): Promise<object> {
        return this.customerService.create(customer);
    }

    @get('/customers/count')
    @response(200, {
        description: 'Customer model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Customer) where?: Where<Customer>,
    ): Promise<object> {
        return this.customerService.count(where);
    }

    @get('/customers')
    @response(200, {
        description: 'Array of Customer model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Customer, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(Customer) filter?: Filter<Customer>,
    ): Promise<object> {
        return this.customerService.find(filter);
    }

    @get('/customers/{id}')
    @response(200, {
        description: 'Customer model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Customer, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Customer, {exclude: 'where'}) filter?: FilterExcludingWhere<Customer>
    ): Promise<object> {
        return this.customerService.findById(id, filter);
    }

    @patch('/customers/{id}')
    @response(204, {
        description: 'Customer PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Customer, {partial: true}),
                },
            },
        })
        customer: Customer,
    ): Promise<void> {
        await this.customerService.updateById(id, customer);
    }

    @patch('/customers/activate-deactivate/{id}')
    @response(200, {
        description: 'customer model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {type: 'string', example: 'En hora buena! La acción se ha realizado con éxito'}
                    }
                }
            },
        },
    })
    async activateDeactivate(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            activateDeactivateComment: {type: 'string'}
                        }
                    },
                },
            },
        })
        body: {activateDeactivateComment: string},
    ): Promise<object> {
        return this.customerService.activateDeactivate(id, body);
    }
}
