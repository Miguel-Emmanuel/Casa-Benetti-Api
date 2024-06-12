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
  response
} from '@loopback/rest';
import {WarehouseServiceBindings} from '../keys';
import {Warehouse} from '../models';
import {WarehouseRepository} from '../repositories';
import {WarehouseService} from '../services';

@authenticate('jwt')
export class WarehouseController {
  constructor(
    @repository(WarehouseRepository)
    public warehouseRepository: WarehouseRepository,
    @inject(WarehouseServiceBindings.WAREHOUSE_SERVICE)
    public warehouseService: WarehouseService
  ) { }

  // @post('/warehouses')
  // @response(200, {
  //   description: 'Warehouse model instance',
  //   content: {'application/json': {schema: getModelSchemaRef(Warehouse)}},
  // })
  // async create(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Warehouse, {
  //           title: 'NewWarehouse',
  //           exclude: ['id'],
  //         }),
  //       },
  //     },
  //   })
  //   warehouse: Omit<Warehouse, 'id'>,
  // ): Promise<Warehouse> {
  //   return this.warehouseRepository.create(warehouse);
  // }

  @get('/warehouses/count')
  @response(200, {
    description: 'Warehouse model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Warehouse) where?: Where<Warehouse>,
  ): Promise<object> {
    return this.warehouseService.count(where);
  }

  @get('/warehouses')
  @response(200, {
    description: 'Array of Warehouse model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Warehouse, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Warehouse) filter?: Filter<Warehouse>,
  ): Promise<object> {
    return this.warehouseService.find(filter);
  }

  @get('/warehouses/{id}')
  @response(200, {
    description: 'Warehouse model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Warehouse, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Warehouse, {exclude: 'where'}) filter?: FilterExcludingWhere<Warehouse>
  ): Promise<object> {
    return this.warehouseService.findById(id, filter);
  }

  // @patch('/warehouses/{id}')
  // @response(204, {
  //   description: 'Warehouse PATCH success',
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Warehouse, {partial: true}),
  //       },
  //     },
  //   })
  //   warehouse: Warehouse,
  // ): Promise<void> {
  //   await this.warehouseRepository.updateById(id, warehouse);
  // }
}
