import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Classification, ClassificationRelations, Line} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, HasManyRepositoryFactory} from '@loopback/repository';
import {LineRepository} from './line.repository';

export class ClassificationRepository extends SoftCrudRepository<
  Classification,
  typeof Classification.prototype.id,
  ClassificationRelations
> {

  public readonly lines: HasManyRepositoryFactory<Line, typeof Classification.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('LineRepository') protected lineRepositoryGetter: Getter<LineRepository>,
  ) {
    super(Classification, dataSource);
    this.lines = this.createHasManyRepositoryFactoryFor('lines', lineRepositoryGetter,);
    this.registerInclusionResolver('lines', this.lines.inclusionResolver);
  }
}
