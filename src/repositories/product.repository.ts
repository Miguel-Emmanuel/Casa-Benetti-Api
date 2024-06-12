import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Product, ProductRelations, Organization, Document} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {OrganizationRepository} from './organization.repository';
import {DocumentRepository} from './document.repository';

export class ProductRepository extends SoftCrudRepository<
  Product,
  typeof Product.prototype.id,
  ProductRelations
> {

  public readonly organization: BelongsToAccessor<Organization, typeof Product.prototype.id>;

  public readonly documents: HasManyRepositoryFactory<Document, typeof Product.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('OrganizationRepository') protected organizationRepositoryGetter: Getter<OrganizationRepository>, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
  ) {
    super(Product, dataSource);
    this.documents = this.createHasManyRepositoryFactoryFor('documents', documentRepositoryGetter,);
    this.registerInclusionResolver('documents', this.documents.inclusionResolver);
    this.organization = this.createBelongsToAccessorFor('organization', organizationRepositoryGetter,);
    this.registerInclusionResolver('organization', this.organization.inclusionResolver);
  }
}
