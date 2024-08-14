import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InternalExpenses, InternalExpensesRelations, TypesExpenses, Brand} from '../models';
import {TypesExpensesRepository} from './types-expenses.repository';
import {BrandRepository} from './brand.repository';

export class InternalExpensesRepository extends DefaultCrudRepository<
  InternalExpenses,
  typeof InternalExpenses.prototype.id,
  InternalExpensesRelations
> {

  public readonly typesExpenses: BelongsToAccessor<TypesExpenses, typeof InternalExpenses.prototype.id>;

  public readonly brand: BelongsToAccessor<Brand, typeof InternalExpenses.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('TypesExpensesRepository') protected typesExpensesRepositoryGetter: Getter<TypesExpensesRepository>, @repository.getter('BrandRepository') protected brandRepositoryGetter: Getter<BrandRepository>,
  ) {
    super(InternalExpenses, dataSource);
    this.brand = this.createBelongsToAccessorFor('brand', brandRepositoryGetter,);
    this.registerInclusionResolver('brand', this.brand.inclusionResolver);
    this.typesExpenses = this.createBelongsToAccessorFor('typesExpenses', typesExpensesRepositoryGetter,);
    this.registerInclusionResolver('typesExpenses', this.typesExpenses.inclusionResolver);
  }
}
