import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPaymentRecord, CommissionPaymentRecordRelations, User, Project} from '../models';
import {UserRepository} from './user.repository';
import {ProjectRepository} from './project.repository';

export class CommissionPaymentRecordRepository extends DefaultCrudRepository<
  CommissionPaymentRecord,
  typeof CommissionPaymentRecord.prototype.id,
  CommissionPaymentRecordRelations
> {

  public readonly user: BelongsToAccessor<User, typeof CommissionPaymentRecord.prototype.id>;

  public readonly project: BelongsToAccessor<Project, typeof CommissionPaymentRecord.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>,
  ) {
    super(CommissionPaymentRecord, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
