import {authenticate} from '@loopback/authentication';
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
    requestBody,
    response
} from '@loopback/rest';
import {Line} from '../models';
import {LineRepository} from '../repositories';

@authenticate('jwt')
export class LineController {
    constructor(
        @repository(LineRepository)
        public lineRepository: LineRepository,
    ) { }

    // @post('/lines')
    // @response(200, {
    //     description: 'Line model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(Line)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(Line, {
    //                     title: 'NewLine',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     line: Omit<Line, 'id'>,
    // ): Promise<Line> {
    //     return this.lineRepository.create(line);
    // }

    // @get('/lines/count')
    // @response(200, {
    //     description: 'Line model count',
    //     content: {'application/json': {schema: CountSchema}},
    // })
    // async count(
    //     @param.where(Line) where?: Where<Line>,
    // ): Promise<Count> {
    //     return this.lineRepository.count(where);
    // }

    @get('/lines')
    @response(200, {
        description: 'Array of Line model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Line, {includeRelations: true}),
                },
            },
        },
    })
    async find(
        @param.filter(Line) filter?: Filter<Line>,
    ): Promise<Line[]> {
        return this.lineRepository.find(filter);
    }

    @get('/lines/{id}')
    @response(200, {
        description: 'Line model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Line, {includeRelations: true}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Line, {exclude: 'where'}) filter?: FilterExcludingWhere<Line>
    ): Promise<Line> {
        return this.lineRepository.findById(id, filter);
    }

    @patch('/lines/{id}')
    @response(204, {
        description: 'Line PATCH success',
    })
    async updateById(
        @param.path.number('id') id: number,
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Line, {partial: true}),
                },
            },
        })
        line: Line,
    ): Promise<void> {
        await this.lineRepository.updateById(id, line);
    }

    // @del('/lines/{id}')
    // @response(204, {
    //     description: 'Line DELETE success',
    // })
    // async deleteById(@param.path.number('id') id: number): Promise<void> {
    //     await this.lineRepository.deleteById(id);
    // }
}
