import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AdvancePaymentRecord, AdvancePaymentRecordRelations, Project, AccountsReceivable, Document} from '../models';
import {ProjectRepository} from './project.repository';
import {AccountsReceivableRepository} from './accounts-receivable.repository';
import {DocumentRepository} from './document.repository';

export class AdvancePaymentRecordRepository extends DefaultCrudRepository<
  AdvancePaymentRecord,
  typeof AdvancePaymentRecord.prototype.id,
  AdvancePaymentRecordRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AdvancePaymentRecord.prototype.id>;

  public readonly accountsReceivable: BelongsToAccessor<AccountsReceivable, typeof AdvancePaymentRecord.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof AdvancePaymentRecord.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('AccountsReceivableRepository') protected accountsReceivableRepositoryGetter: Getter<AccountsReceivableRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(AdvancePaymentRecord, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.accountsReceivable = this.createBelongsToAccessorFor('accountsReceivable', accountsReceivableRepositoryGetter,);
    this.registerInclusionResolver('accountsReceivable', this.accountsReceivable.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
