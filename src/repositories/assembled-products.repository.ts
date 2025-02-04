import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {AssembledProducts, AssembledProductsRelations, Document} from '../models';
import {OperationHook} from '../operation-hooks';
import {DocumentRepository} from './document.repository';

export class AssembledProductsRepository extends DefaultCrudRepository<
  AssembledProducts,
  typeof AssembledProducts.prototype.id,
  AssembledProductsRelations
> {

  public readonly document: HasOneRepositoryFactory<Document, typeof AssembledProducts.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('DocumentRepository') protected documentRepositoryGetter: Getter<DocumentRepository>,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
  ) {
    super(AssembledProducts, dataSource);
    this.definePersistedModel(AssembledProducts)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.ASSEMPLEDPRODUCTS);
    });
    this.document = this.createHasOneRepositoryFactoryFor('document', documentRepositoryGetter);
    this.registerInclusionResolver('document', this.document.inclusionResolver);
  }
}
