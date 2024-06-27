import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, repository, HasManyRepositoryFactory, HasOneRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Project, ProjectRelations, Quotation, AdvancePaymentRecord, CommissionPaymentRecord, Branch, Customer, Document} from '../models';
import {OperationHook} from '../operation-hooks';
import {QuotationRepository} from './quotation.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {AdvancePaymentRecordRepository} from './advance-payment-record.repository';
import {CommissionPaymentRecordRepository} from './commission-payment-record.repository';
import {BranchRepository} from './branch.repository';
import {CustomerRepository} from './customer.repository';
import {DocumentRepository} from './document.repository';

export class ProjectRepository extends SoftCrudRepository<
  Project,
  typeof Project.prototype.id,
  ProjectRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof Project.prototype.id>;

  public readonly advancePaymentRecords: HasManyRepositoryFactory<AdvancePaymentRecord, typeof Project.prototype.id>;

  public readonly commissionPaymentRecords: HasManyRepositoryFactory<CommissionPaymentRecord, typeof Project.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Project.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof Project.prototype.id>;

  public readonly clientQuoteFile: HasOneRepositoryFactory<Document, typeof Project.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
    @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('AdvancePaymentRecordRepository') protected advancePaymentRecordRepositoryGetter: Getter<AdvancePaymentRecordRepository>, @repository.getter('CommissionPaymentRecordRepository') protected commissionPaymentRecordRepositoryGetter: Getter<CommissionPaymentRecordRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(Project, dataSource);
    this.clientQuoteFile = this.createHasOneRepositoryFactoryFor('clientQuoteFile', documentRepositoryGetter);
    this.registerInclusionResolver('clientQuoteFile', this.clientQuoteFile.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.commissionPaymentRecords = this.createHasManyRepositoryFactoryFor('commissionPaymentRecords', commissionPaymentRecordRepositoryGetter,);
    this.registerInclusionResolver('commissionPaymentRecords', this.commissionPaymentRecords.inclusionResolver);
    this.advancePaymentRecords = this.createHasManyRepositoryFactoryFor('advancePaymentRecords', advancePaymentRecordRepositoryGetter,);
    this.registerInclusionResolver('advancePaymentRecords', this.advancePaymentRecords.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.definePersistedModel(Project)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.PROJECT);
    });
  }
}
