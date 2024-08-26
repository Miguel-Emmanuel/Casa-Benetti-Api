import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {InternalExpenses, InternalExpensesRelations, TypesExpenses, Branch} from '../models';
import {TypesExpensesRepository} from './types-expenses.repository';
import {BranchRepository} from './branch.repository';

export class InternalExpensesRepository extends DefaultCrudRepository<
  InternalExpenses,
  typeof InternalExpenses.prototype.id,
  InternalExpensesRelations
> {

  public readonly typesExpenses: BelongsToAccessor<TypesExpenses, typeof InternalExpenses.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof InternalExpenses.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('TypesExpensesRepository') protected typesExpensesRepositoryGetter: Getter<TypesExpensesRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>,
  ) {
    super(InternalExpenses, dataSource);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.typesExpenses = this.createBelongsToAccessorFor('typesExpenses', typesExpensesRepositoryGetter,);
    this.registerInclusionResolver('typesExpenses', this.typesExpenses.inclusionResolver);
  }
}
