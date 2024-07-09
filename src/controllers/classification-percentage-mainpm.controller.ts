import {
    repository
} from '@loopback/repository';
import {
    del,
    param,
    response
} from '@loopback/rest';
import {ClassificationPercentageMainpmRepository} from '../repositories';

export class ClassificationPercentageMainpmController {
    constructor(
        @repository(ClassificationPercentageMainpmRepository)
        public classificationPercentageMainpmRepository: ClassificationPercentageMainpmRepository,
    ) { }

    // @post('/classification-percentage-mainpms')
    // @response(200, {
    //     description: 'ClassificationPercentageMainpm model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(ClassificationPercentageMainpm)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(ClassificationPercentageMainpm, {
    //                     title: 'NewClassificationPercentageMainpm',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     classificationPercentageMainpm: Omit<ClassificationPercentageMainpm, 'id'>,
    // ): Promise<ClassificationPercentageMainpm> {
    //     return this.classificationPercentageMainpmRepository.create(classificationPercentageMainpm);
    // }

    // @get('/classification-percentage-mainpms/count')
    // @response(200, {
    //     description: 'ClassificationPercentageMainpm model count',
    //     content: {'application/json': {schema: CountSchema}},
    // })
    // async count(
    //     @param.where(ClassificationPercentageMainpm) where?: Where<ClassificationPercentageMainpm>,
    // ): Promise<Count> {
    //     return this.classificationPercentageMainpmRepository.count(where);
    // }

    // @get('/classification-percentage-mainpms')
    // @response(200, {
    //     description: 'Array of ClassificationPercentageMainpm model instances',
    //     content: {
    //         'application/json': {
    //             schema: {
    //                 type: 'array',
    //                 items: getModelSchemaRef(ClassificationPercentageMainpm, {includeRelations: true}),
    //             },
    //         },
    //     },
    // })
    // async find(
    //     @param.filter(ClassificationPercentageMainpm) filter?: Filter<ClassificationPercentageMainpm>,
    // ): Promise<ClassificationPercentageMainpm[]> {
    //     return this.classificationPercentageMainpmRepository.find(filter);
    // }


    // @get('/classification-percentage-mainpms/{id}')
    // @response(200, {
    //     description: 'ClassificationPercentageMainpm model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(ClassificationPercentageMainpm, {includeRelations: true}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(ClassificationPercentageMainpm, {exclude: 'where'}) filter?: FilterExcludingWhere<ClassificationPercentageMainpm>
    // ): Promise<ClassificationPercentageMainpm> {
    //     return this.classificationPercentageMainpmRepository.findById(id, filter);
    // }

    // @patch('/classification-percentage-mainpms/{id}')
    // @response(204, {
    //     description: 'ClassificationPercentageMainpm PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(ClassificationPercentageMainpm, {partial: true}),
    //             },
    //         },
    //     })
    //     classificationPercentageMainpm: ClassificationPercentageMainpm,
    // ): Promise<void> {
    //     await this.classificationPercentageMainpmRepository.updateById(id, classificationPercentageMainpm);
    // }

    @del('/classification-percentage/{id}')
    @response(204, {
        description: 'ClassificationPercentageMainpm DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.classificationPercentageMainpmRepository.deleteById(id);
    }
}
