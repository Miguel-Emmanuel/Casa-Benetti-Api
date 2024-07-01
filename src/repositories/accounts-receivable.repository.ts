import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {AccountsReceivable, AccountsReceivableRelations, Project, Customer, AdvancePaymentRecord, Quotation} from '../models';
import {ProjectRepository} from './project.repository';
import {CustomerRepository} from './customer.repository';
import {AdvancePaymentRecordRepository} from './advance-payment-record.repository';
import {QuotationRepository} from './quotation.repository';

export class AccountsReceivableRepository extends DefaultCrudRepository<
  AccountsReceivable,
  typeof AccountsReceivable.prototype.id,
  AccountsReceivableRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof AccountsReceivable.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof AccountsReceivable.prototype.id>;

  public readonly advancePaymentRecords: HasManyRepositoryFactory<AdvancePaymentRecord, typeof AccountsReceivable.prototype.id>;

  public readonly quotation: BelongsToAccessor<Quotation, typeof AccountsReceivable.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('AdvancePaymentRecordRepository') protected advancePaymentRecordRepositoryGetter: Getter<AdvancePaymentRecordRepository>, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>,
  ) {
    super(AccountsReceivable, dataSource);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
    this.advancePaymentRecords = this.createHasManyRepositoryFactoryFor('advancePaymentRecords', advancePaymentRecordRepositoryGetter,);
    this.registerInclusionResolver('advancePaymentRecords', this.advancePaymentRecords.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
  }
}
