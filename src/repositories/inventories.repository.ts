import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Inventories, InventoriesRelations, QuotationProducts, Branch, Warehouse, InventoryMovements, Container, Collection} from '../models';
import {QuotationProductsRepository} from './quotation-products.repository';
import {BranchRepository} from './branch.repository';
import {WarehouseRepository} from './warehouse.repository';
import {InventoryMovementsRepository} from './inventory-movements.repository';
import {ContainerRepository} from './container.repository';
import {CollectionRepository} from './collection.repository';

export class InventoriesRepository extends DefaultCrudRepository<
  Inventories,
  typeof Inventories.prototype.id,
  InventoriesRelations
> {

  public readonly quotationProducts: BelongsToAccessor<QuotationProducts, typeof Inventories.prototype.id>;

  public readonly branch: BelongsToAccessor<Branch, typeof Inventories.prototype.id>;

  public readonly warehouse: BelongsToAccessor<Warehouse, typeof Inventories.prototype.id>;

  public readonly inventoryMovements: HasManyRepositoryFactory<InventoryMovements, typeof Inventories.prototype.id>;

  public readonly container: BelongsToAccessor<Container, typeof Inventories.prototype.id>;

  public readonly collection: BelongsToAccessor<Collection, typeof Inventories.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('QuotationProductsRepository') protected quotationProductsRepositoryGetter: Getter<QuotationProductsRepository>, @repository.getter('BranchRepository') protected branchRepositoryGetter: Getter<BranchRepository>, @repository.getter('WarehouseRepository') protected warehouseRepositoryGetter: Getter<WarehouseRepository>, @repository.getter('InventoryMovementsRepository') protected inventoryMovementsRepositoryGetter: Getter<InventoryMovementsRepository>, @repository.getter('ContainerRepository') protected containerRepositoryGetter: Getter<ContainerRepository>, @repository.getter('CollectionRepository') protected collectionRepositoryGetter: Getter<CollectionRepository>,
  ) {
    super(Inventories, dataSource);
    this.collection = this.createBelongsToAccessorFor('collection', collectionRepositoryGetter,);
    this.registerInclusionResolver('collection', this.collection.inclusionResolver);
    this.container = this.createBelongsToAccessorFor('container', containerRepositoryGetter,);
    this.registerInclusionResolver('container', this.container.inclusionResolver);
    this.inventoryMovements = this.createHasManyRepositoryFactoryFor('inventoryMovements', inventoryMovementsRepositoryGetter,);
    this.registerInclusionResolver('inventoryMovements', this.inventoryMovements.inclusionResolver);
    this.warehouse = this.createBelongsToAccessorFor('warehouse', warehouseRepositoryGetter,);
    this.registerInclusionResolver('warehouse', this.warehouse.inclusionResolver);
    this.branch = this.createBelongsToAccessorFor('branch', branchRepositoryGetter,);
    this.registerInclusionResolver('branch', this.branch.inclusionResolver);
    this.quotationProducts = this.createBelongsToAccessorFor('quotationProducts', quotationProductsRepositoryGetter,);
    this.registerInclusionResolver('quotationProducts', this.quotationProducts.inclusionResolver);
  }
}
