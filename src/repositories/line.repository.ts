import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Line, LineRelations, Classification} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, BelongsToAccessor} from '@loopback/repository';
import {ClassificationRepository} from './classification.repository';

export class LineRepository extends SoftCrudRepository<
  Line,
  typeof Line.prototype.id,
  LineRelations
> {

  public readonly classification: BelongsToAccessor<Classification, typeof Line.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ClassificationRepository') protected classificationRepositoryGetter: Getter<ClassificationRepository>,
  ) {
    super(Line, dataSource);
    this.classification = this.createBelongsToAccessorFor('classification', classificationRepositoryGetter,);
    this.registerInclusionResolver('classification', this.classification.inclusionResolver);
  }
}
