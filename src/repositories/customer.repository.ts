import {inject} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Customer, CustomerRelations} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class CustomerRepository extends SoftCrudRepository<
  Customer,
  typeof Customer.prototype.id,
  CustomerRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Customer, dataSource);
  }
}
