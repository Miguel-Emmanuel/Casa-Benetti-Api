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

  @property({
    type: 'number',
  })
  assembledProductsId?: number;

  @property({
    type: 'number',
  })
  proofPaymentQuotationId?: number;

  @property({
    type: 'number',
  })
  clientQuoteFileId?: number;

  @property({
    type: 'number',
  })
  providerFileId?: number;

  @property({
    type: 'number',
  })
  advanceFileId?: number;

  @property({
    type: 'number',
  })
  projectId?: number;

  @property({
    type: 'number',
  })
  advancePaymentRecordId?: number;

  @property({
    type: 'number',
  })
  mainMaterialId?: number;

  @property({
    type: 'number',
  })
  mainFinishId?: number;

  @property({
    type: 'number',
  })
  secondaryMaterialId?: number;

  @property({
    type: 'number',
  })
  secondaryFinishingId?: number;

  @property({
    type: 'number',
  })
  proformaId?: number;

  @property({
    type: 'number',
  })
  accountPayableHistoryId?: number;

  @property({
    type: 'number',
  })
  commissionPaymentId?: number;

  @property({
    type: 'number',
  })
  deliveryRequestId?: number;

  @property({
    type: 'number',
  })
  collectionId?: number;

  @property({
    type: 'number',
  })
  containerId?: number;

  @property({
    type: 'number',
  })
  clientQuoteId?: number;

  constructor(data?: Partial<Document>) {
    super(data);
  }
}

export interface DocumentRelations {
  // describe navigational properties here
}

export type DocumentWithRelations = Document & DocumentRelations;
