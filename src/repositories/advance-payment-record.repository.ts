import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AdvancePaymentRecord, AdvancePaymentRecordRelations, Project, AccountsReceivable} from '../models';
import {ProjectRepository} from './project.repository';
import {AccountsReceivableRepository} from './accounts-receivable.repository';

export class AdvancePaymentRecordRepository extends DefaultCrudRepository<
  AdvancePaymentRecord,
  typeof AdvancePaymentRecord.prototype.id,
  AdvancePaymentRecordRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AdvancePaymentRecord.prototype.id>;

  public readonly accountsReceivable: BelongsToAccessor<AccountsReceivable, typeof AdvancePaymentRecord.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('AccountsReceivableRepository') protected accountsReceivableRepositoryGetter: Getter<AccountsReceivableRepository>,
  ) {
    super(AdvancePaymentRecord, dataSource);
    this.accountsReceivable = this.createBelongsToAccessorFor('accountsReceivable', accountsReceivableRepositoryGetter,);
    this.registerInclusionResolver('accountsReceivable', this.accountsReceivable.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
