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
    post,
    requestBody,
    response
} from '@loopback/rest';
import {BrandServiceBindings} from '../keys';
import {Brand, Provider} from '../models';
import {BrandRepository} from '../repositories';
import {BrandService} from '../services';

@authenticate('jwt')
export class BrandController {
    constructor(
        @repository(BrandRepository)
        public brandRepository: BrandRepository,
        @inject(BrandServiceBindings.BRAND_SERVICE)
        public brandService: BrandService
    ) { }

    @post('/brands')
    @response(200, {
        description: 'Brand model instance',
        content: {'application/json': {schema: getModelSchemaRef(Brand)}},
    })
    async create(
        @requestBody({
            content: {
                'application/json': {
                    schema: getModelSchemaRef(Brand, {
                        title: 'NewBrand',
                        exclude: ['id'],
                    }),
                },
            },
        })
        brand: Omit<Brand, 'id'>,
    ): Promise<object> {
        return this.brandService.create(brand);
    }

    @get('/brands/count')
    @response(200, {
        description: 'Brand model count',
        content: {'application/json': {schema: CountSchema}},
    })
    async count(
        @param.where(Brand) where?: Where<Brand>,
    ): Promise<object> {
        return this.brandService.count(where);
    }

    @get('/brands')
    @response(200, {
        description: 'Array of Brand model instances',
        content: {
            'application/json': {
                schema: {
                    type: 'array',
                    items: getModelSchemaRef(Brand, {includeRelations: false}),
                },
            },
        },
    })
    async find(
        @param.filter(Brand) filter?: Filter<Brand>,
    ): Promise<object> {
        return this.brandService.find(filter);
    }

    @get('/brands/{id}')
    @response(200, {
        description: 'Brand model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Brand, {includeRelations: false}),
            },
        },
    })
    async findById(
        @param.path.number('id') id: number,
        @param.filter(Brand, {exclude: 'where'}) filter?: FilterExcludingWhere<Brand>
    ): Promise<object> {
        return this.brandService.findById(id, filter);
    }

    @get('/brands/{id}/providers')
    @response(200, {
        description: 'Brand model instance',
        content: {
            'application/json': {
                schema: getModelSchemaRef(Provider, {exclude: []}),
            },
        },
    })
    async getProvidersById(
        @param.path.number('id') id: number,
        @param.filter(Brand, {exclude: 'where'}) filter?: FilterExcludingWhere<Brand>
    ): Promise<object> {
        return this.brandService.getProvidersById(id, filter);
    }

    // @patch('/brands/{id}')
    // @response(204, {
    //   description: 'Brand PATCH success',
    // })
    // async updateById(
    //   @param.path.number('id') id: number,
    //   @requestBody({
    //     content: {
    //       'application/json': {
    //         schema: getModelSchemaRef(Brand, {partial: true}),
    //       },
    //     },
    //   })
    //   brand: Brand,
    // ): Promise<void> {
    //   await this.brandService.updateById(id, brand);
    // }
}
