import {
    repository
} from '@loopback/repository';
import {
    del,
    param,
    response
} from '@loopback/rest';
import {AssembledProductsRepository} from '../repositories';

export class AssembledProductsController {
    constructor(
        @repository(AssembledProductsRepository)
        public assembledProductsRepository: AssembledProductsRepository,
    ) { }

    // @post('/assembled-products')
    // @response(200, {
    //     description: 'AssembledProducts model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(AssembledProducts)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(AssembledProducts, {
    //                     title: 'NewAssembledProducts',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     assembledProducts: Omit<AssembledProducts, 'id'>,
    // ): Promise<AssembledProducts> {
    //     return this.assembledProductsRepository.create(assembledProducts);
    // }

    // @get('/assembled-products/count')
    // @response(200, {
    //     description: 'AssembledProducts model count',
    //     content: {'application/json': {schema: CountSchema}},
    // })
    // async count(
    //     @param.where(AssembledProducts) where?: Where<AssembledProducts>,
    // ): Promise<Count> {
    //     return this.assembledProductsRepository.count(where);
    // }

    // @get('/assembled-products')
    // @response(200, {
    //     description: 'Array of AssembledProducts model instances',
    //     content: {
    //         'application/json': {
    //             schema: {
    //                 type: 'array',
    //                 items: getModelSchemaRef(AssembledProducts, {includeRelations: true}),
    //             },
    //         },
    //     },
    // })
    // async find(
    //     @param.filter(AssembledProducts) filter?: Filter<AssembledProducts>,
    // ): Promise<AssembledProducts[]> {
    //     return this.assembledProductsRepository.find(filter);
    // }



    // @get('/assembled-products/{id}')
    // @response(200, {
    //     description: 'AssembledProducts model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(AssembledProducts, {includeRelations: true}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(AssembledProducts, {exclude: 'where'}) filter?: FilterExcludingWhere<AssembledProducts>
    // ): Promise<AssembledProducts> {
    //     return this.assembledProductsRepository.findById(id, filter);
    // }

    // @patch('/assembled-products/{id}')
    // @response(204, {
    //     description: 'AssembledProducts PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(AssembledProducts, {partial: true}),
    //             },
    //         },
    //     })
    //     assembledProducts: AssembledProducts,
    // ): Promise<void> {
    //     await this.assembledProductsRepository.updateById(id, assembledProducts);
    // }


    @del('/assembled-products/{id}')
    @response(204, {
        description: 'AssembledProducts DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.assembledProductsRepository.deleteById(id);
    }
}
