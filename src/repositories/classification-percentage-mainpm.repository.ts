import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {ClassificationPercentageMainpm, ClassificationPercentageMainpmRelations} from '../models';

export class ClassificationPercentageMainpmRepository extends DefaultCrudRepository<
  ClassificationPercentageMainpm,
  typeof ClassificationPercentageMainpm.prototype.id,
  ClassificationPercentageMainpmRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(ClassificationPercentageMainpm, dataSource);
  }
}
