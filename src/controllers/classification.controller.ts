import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    Count,
    CountSchema,
    Filter,
    FilterExcludingWhere,
    repository,
    Where,
} from '@loopback/repository';
import {
    del,
    get,
    getModelSchemaRef,
    param,
    patch,
    post,
    requestBody,
    response
} from '@loopback/rest';
import {Classification, Line} from '../models';
import {ClassificationRepository} from '../repositories';
import {ClassificationService} from '../services';

@authenticate('jwt')
export class ClassificationController {
    constructor(
        @repository(ClassificationRepository)
        public classificationRepository: ClassificationRepository,
        @service()
        public classificationService: ClassificationService
    ) { }

    @post('/classifications')
    @response(200, {
        description: 'Classification model instance',
        content: {'application/json': {schema: getModelSchemaRef(Classification)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Classification, {
                        title: 'NewClassification',
                        exclude: ['id'],
                    }),
                },
            },
        })
        classification: Omit<Classification, 'id'>,
    ): Promise<Classification> {
        return this.classificationRepository.create(classification);
    }

    @get('/classifications/count')
    @response(200, {
        description: 'Classification model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Classification) where?: Where<Classification>,
    ): Promise<Count> {
        return this.classificationRepository.count(where);
    }

    @get('/classifications')
    @response(200, {
        description: 'Array of Classification model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Classification, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Classification) filter?: Filter<Classification>,
    ): Promise<Classification[]> {
        return this.classificationRepository.find(filter);
    }


    @get('/classifications/{id}')
    @response(200, {
        description: 'Classification model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Classification, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Classification, {exclude: 'where'}) filter?: FilterExcludingWhere<Classification>
    ): Promise<Classification> {
        return this.classificationRepository.findById(id, filter);
    }

    @get('/classifications/{id}/line')
    @response(200, {
        description: 'Classification model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Line,),
                },
            },
        },
    })
    async findLineById(
        @param.path.number('id') id: number,
    ): Promise<Line[]> {
        return this.classificationService.findLineById(id);
    }

    @patch('/classifications/{id}')
    @response(204, {
        description: 'Classification PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Classification, {partial: true}),
                },
            },
        })
        classification: Classification,
    ): Promise<void> {
        await this.classificationRepository.updateById(id, classification);
    }

    @del('/classifications/{id}')
    @response(204, {
        description: 'Classification DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.classificationRepository.deleteById(id);
    }
}
