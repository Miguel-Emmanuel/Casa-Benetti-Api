import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AdvancePaymentRecord, AdvancePaymentRecordRelations, Project} from '../models';
import {ProjectRepository} from './project.repository';

export class AdvancePaymentRecordRepository extends DefaultCrudRepository<
  AdvancePaymentRecord,
  typeof AdvancePaymentRecord.prototype.id,
  AdvancePaymentRecordRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AdvancePaymentRecord.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(AdvancePaymentRecord, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
