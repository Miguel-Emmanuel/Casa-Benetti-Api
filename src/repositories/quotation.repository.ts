import {inject, Getter} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {Quotation, QuotationRelations, User, QuotationProjectManager, QuotationDesigner} from '../models';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';
import {repository, HasManyThroughRepositoryFactory} from '@loopback/repository';
import {QuotationProjectManagerRepository} from './quotation-project-manager.repository';
import {UserRepository} from './user.repository';
import {QuotationDesignerRepository} from './quotation-designer.repository';

export class QuotationRepository extends SoftCrudRepository<
  Quotation,
  typeof Quotation.prototype.id,
  QuotationRelations
> {

  public readonly projectManagers: HasManyThroughRepositoryFactory<User, typeof User.prototype.id,
          QuotationProjectManager,
          typeof Quotation.prototype.id
        >;

  public readonly designers: HasManyThroughRepositoryFactory<User, typeof User.prototype.id,
          QuotationDesigner,
          typeof Quotation.prototype.id
        >;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProjectManagerRepository') protected quotationProjectManagerRepositoryGetter: Getter<QuotationProjectManagerRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('QuotationDesignerRepository') protected quotationDesignerRepositoryGetter: Getter<QuotationDesignerRepository>,
  ) {
    super(Quotation, dataSource);
    this.designers = this.createHasManyThroughRepositoryFactoryFor('designers', userRepositoryGetter, quotationDesignerRepositoryGetter,);
    this.registerInclusionResolver('designers', this.designers.inclusionResolver);
    this.projectManagers = this.createHasManyThroughRepositoryFactoryFor('projectManagers', userRepositoryGetter, quotationProjectManagerRepositoryGetter,);
    this.registerInclusionResolver('projectManagers', this.projectManagers.inclusionResolver);
  }
}
