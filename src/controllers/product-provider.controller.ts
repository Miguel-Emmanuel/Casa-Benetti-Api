import {authenticate} from '@loopback/authentication';
import {
    repository
} from '@loopback/repository';
import {
    del,
    param,
    response
} from '@loopback/rest';
import {ProductProviderRepository} from '../repositories';

@authenticate('jwt')
export class ProductProviderController {
    constructor(
        @repository(ProductProviderRepository)
        public productProviderRepository: ProductProviderRepository,
    ) { }

    // @post('/product-providers')
    // @response(200, {
    //     description: 'ProductProvider model instance',
    //     content: {'application/json': {schema: getModelSchemaRef(ProductProvider)}},
    // })
    // async create(
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(ProductProvider, {
    //                     title: 'NewProductProvider',
    //                     exclude: ['id'],
    //                 }),
    //             },
    //         },
    //     })
    //     productProvider: Omit<ProductProvider, 'id'>,
    // ): Promise<ProductProvider> {
    //     return this.productProviderRepository.create(productProvider);
    // }

    // @get('/product-providers/count')
    // @response(200, {
    //     description: 'ProductProvider model count',
    //     content: {'application/json': {schema: CountSchema}},
    // })
    // async count(
    //     @param.where(ProductProvider) where?: Where<ProductProvider>,
    // ): Promise<Count> {
    //     return this.productProviderRepository.count(where);
    // }

    // @get('/product-providers')
    // @response(200, {
    //     description: 'Array of ProductProvider model instances',
    //     content: {
    //         'application/json': {
    //             schema: {
    //                 type: 'array',
    //                 items: getModelSchemaRef(ProductProvider, {includeRelations: false}),
    //             },
    //         },
    //     },
    // })
    // async find(
    //     @param.filter(ProductProvider) filter?: Filter<ProductProvider>,
    // ): Promise<ProductProvider[]> {
    //     return this.productProviderRepository.find(filter);
    // }


    // @get('/product-providers/{id}')
    // @response(200, {
    //     description: 'ProductProvider model instance',
    //     content: {
    //         'application/json': {
    //             schema: getModelSchemaRef(ProductProvider, {includeRelations: false}),
    //         },
    //     },
    // })
    // async findById(
    //     @param.path.number('id') id: number,
    //     @param.filter(ProductProvider, {exclude: 'where'}) filter?: FilterExcludingWhere<ProductProvider>
    // ): Promise<ProductProvider> {
    //     return this.productProviderRepository.findById(id, filter);
    // }

    // @patch('/product-providers/{id}')
    // @response(204, {
    //     description: 'ProductProvider PATCH success',
    // })
    // async updateById(
    //     @param.path.number('id') id: number,
    //     @requestBody({
    //         content: {
    //             'application/json': {
    //                 schema: getModelSchemaRef(ProductProvider, {partial: true}),
    //             },
    //         },
    //     })
    //     productProvider: ProductProvider,
    // ): Promise<void> {
    //     await this.productProviderRepository.updateById(id, productProvider);
    // }


    @del('/product-providers/{id}')
    @response(204, {
        description: 'ProductProvider DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.productProviderRepository.deleteById(id);
    }
}
