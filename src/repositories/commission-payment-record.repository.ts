import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CommissionPaymentRecord, CommissionPaymentRecordRelations, User, Project, CommissionPayment} from '../models';
import {UserRepository} from './user.repository';
import {ProjectRepository} from './project.repository';
import {CommissionPaymentRepository} from './commission-payment.repository';

export class CommissionPaymentRecordRepository extends DefaultCrudRepository<
  CommissionPaymentRecord,
  typeof CommissionPaymentRecord.prototype.id,
  CommissionPaymentRecordRelations
> {

  public readonly user: BelongsToAccessor<User, typeof CommissionPaymentRecord.prototype.id>;

  public readonly project: BelongsToAccessor<Project, typeof CommissionPaymentRecord.prototype.id>;

  public readonly commissionPayments: HasManyRepositoryFactory<CommissionPayment, typeof CommissionPaymentRecord.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('CommissionPaymentRepository') protected commissionPaymentRepositoryGetter: Getter<CommissionPaymentRepository>,
  ) {
    super(CommissionPaymentRecord, dataSource);
    this.commissionPayments = this.createHasManyRepositoryFactoryFor('commissionPayments', commissionPaymentRepositoryGetter,);
    this.registerInclusionResolver('commissionPayments', this.commissionPayments.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter,);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
