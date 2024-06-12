import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Product, ProductRelations, Organization} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, BelongsToAccessor} from '@loopback/repository';
import {OrganizationRepository} from './organization.repository';

export class ProductRepository extends SoftCrudRepository<
  Product,
  typeof Product.prototype.id,
  ProductRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Product.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>,
  ) {
    super(Product, dataSource);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
  }
}
