import {service} from '@loopback/core';
import {
    Filter,
    FilterExcludingWhere,
    repository
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
import {DayExchangeRate} from '../models';
import {DayExchangeRateRepository} from '../repositories';
import {DayExchangeRateService} from '../services';

export class DayExchangeRateController {
    constructor(
        @repository(DayExchangeRateRepository)
        public dayExchangeRateRepository: DayExchangeRateRepository,
        @service()
        public dayExchangeRateService: DayExchangeRateService
    ) { }

    @post('/day-exchange-rates')
    @response(200, {
        description: 'DayExchangeRate model instance',
        content: {'application/json': {schema: getModelSchemaRef(DayExchangeRate)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(DayExchangeRate, {
                        title: 'NewDayExchangeRate',
                        exclude: ['id'],
                    }),
                },
            },
        })
        dayExchangeRate: Omit<DayExchangeRate, 'id'>,
    ): Promise<DayExchangeRate> {
        return this.dayExchangeRateService.create(dayExchangeRate);
    }

    @get('/day-exchange-rates')
    @response(200, {
        description: 'Array of DayExchangeRate model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(DayExchangeRate, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(DayExchangeRate) filter?: Filter<DayExchangeRate>,
    ): Promise<DayExchangeRate[]> {
        return this.dayExchangeRateService.find(filter);
    }

    @get('/day-exchange-rates/{id}')
    @response(200, {
        description: 'DayExchangeRate model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(DayExchangeRate, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(DayExchangeRate, {exclude: 'where'}) filter?: FilterExcludingWhere<DayExchangeRate>
    ): Promise<DayExchangeRate> {
        return this.dayExchangeRateService.findById(id, filter);
    }

    @patch('/day-exchange-rates/{id}')
    @response(204, {
        description: 'DayExchangeRate PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(DayExchangeRate, {partial: true}),
                },
            },
        })
        dayExchangeRate: DayExchangeRate,
    ): Promise<void> {
        await this.dayExchangeRateRepository.updateById(id, dayExchangeRate);
    }

    // @del('/day-exchange-rates/{id}')
    // @response(204, {
    //     description: 'DayExchangeRate DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.dayExchangeRateRepository.deleteById(id);
    // }
}
