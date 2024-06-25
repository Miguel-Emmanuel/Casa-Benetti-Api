import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Project, ProjectRelations, Quotation} from '../models';
import {QuotationRepository} from './quotation.repository';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class ProjectRepository extends SoftCrudRepository<
  Project,
  typeof Project.prototype.id,
  ProjectRelations
> {

  public readonly quotation: BelongsToAccessor<Quotation, typeof Project.prototype.id>;


  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationRepository') protected quotationRepositoryGetter: Getter<QuotationRepository>,
  ) {
    super(Project, dataSource);
    this.quotation = this.createBelongsToAccessorFor('quotation', quotationRepositoryGetter,);
    this.registerInclusionResolver('quotation', this.quotation.inclusionResolver);
  }
}
