import {Getter, inject} from '@loopback/core';
import {DbDataSource} from '../datasources';
import {LogModelName} from '../enums';
import {OperationHookBindings} from '../keys';
import {Document, DocumentRelations} from '../models';
import {OperationHook} from '../operation-hooks';
import {SoftCrudRepository} from './soft-delete-entity.repository.base';

export class DocumentRepository extends SoftCrudRepository<
  Document,
  typeof Document.prototype.id,
  DocumentRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
    @inject.getter(OperationHookBindings.OPERATION_SERVICE)
    public operationHook: Getter<OperationHook>,
  ) {
    super(Document, dataSource);
    this.definePersistedModel(Document)
    this.modelClass.observe('before save', async (ctx: any) => {
      const hook = await this.operationHook();
      await hook.beforeSave(this, ctx, LogModelName.DOCUMENT);
    });
  }
}
