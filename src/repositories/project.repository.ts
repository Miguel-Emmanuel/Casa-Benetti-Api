import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Project, ProjectRelations, Quotation, Customer} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, BelongsToAccessor} from '@loopback/repository';
import {QuotationRepository} from './quotation.repository';
import {CustomerRepository} from './customer.repository';

export class ProjectRepository extends SoftCrudRepository<
  Project,
  typeof Project.prototype.id,
  ProjectRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof Project.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof Project.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(Project, dataSource);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
  }
}
