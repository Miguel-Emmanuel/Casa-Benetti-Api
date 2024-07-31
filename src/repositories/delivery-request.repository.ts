import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {DeliveryRequest, DeliveryRequestRelations} from '../models';

export class DeliveryRequestRepository extends DefaultCrudRepository<
  DeliveryRequest,
  typeof DeliveryRequest.prototype.id,
  DeliveryRequestRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(DeliveryRequest, dataSource);
  }
}
