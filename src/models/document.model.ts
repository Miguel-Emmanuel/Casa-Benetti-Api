import {model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';

@model({
  settings: {
    postgresql: {
      table: 'doc_Document' // Nombre de la tabla en PostgreSQL
    },
  }
})
export class Document extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  fileURL?: string;

  @property({
    type: 'string',
  })
  name?: string;


  @property({
    type: 'string',
  })
  alias?: string;

  @property({
    type: 'string',
  })
  extension?: string;

  @property({
    type: 'number',
  })
  userDataId?: number;

  @property({
    type: 'number',
  })
  productId?: number;

  constructor(data?: Partial<Document>) {
    super(data);
  }
}

export interface DocumentRelations {
  // describe navigational properties here
}

export type DocumentWithRelations = Document & DocumentRelations;
