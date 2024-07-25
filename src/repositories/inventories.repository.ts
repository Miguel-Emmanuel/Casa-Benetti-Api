import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Inventories, InventoriesRelations, QuotationProducts, Branch, Warehouse} from '../models';
import {QuotationProductsRepository} from './quotation-products.repository';
import {BranchRepository} from './branch.repository';
import {WarehouseRepository} from './warehouse.repository';

export class InventoriesRepository extends DefaultCrudRepository<
  Inventories,
  typeof Inventories.prototype.id,
  InventoriesRelations
> {

  public readonly quotationProducts: BelongsToAccessor<QuotationProducts, typeof Inventories.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Inventories.prototype.id>;

  public readonly warehouse: BelongsToAccessor<Warehouse, typeof Inventories.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('WarehouseRepository') protected warehouseRepositoryGetter: Getter<WarehouseRepository>,
  ) {
    super(Inventories, dataSource);
    this.warehouse = this.createBelongsToAccessorFor('warehouse', warehouseRepositoryGetter,);
    this.registerInclusionResolver('warehouse', this.warehouse.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.quotationProducts = this.createBelongsToAccessorFor('quotationProducts', quotationProductsRepositoryGetter,);
    this.registerInclusionResolver('quotationProducts', this.quotationProducts.inclusionResolver);
  }
}
