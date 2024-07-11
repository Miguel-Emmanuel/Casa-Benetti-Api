import {Entity, belongsTo, model, property} from '@loopback/repository';
import {PurchaseOrdersStatus} from '../enums';
import {AccountPayable} from './account-payable.model';
import {Proforma} from './proforma.model';

@model({
  settings: {
    postgresql: {
      table: 'proforma_PurchaseOrders' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_purchaseOrders_accountPayableId: {
        name: 'fk_purchaseOrders_accountPayableId',
        entity: 'AccountPayable',
        entityKey: 'id',
        foreignKey: 'accountpayableid',
      },
      fk_purchaseOrders_proformaId: {
        name: 'fk_purchaseOrders_proformaId',
        entity: 'Proforma',
        entityKey: 'id',
        foreignKey: 'proformaid',
      },
    }
  }
})
export class PurchaseOrders extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  //Estatus
  @property({
    type: 'string',
    required: true,
    default: PurchaseOrdersStatus.NUEVA
  })
  status: PurchaseOrdersStatus;

  @belongsTo(() => AccountPayable)
  accountPayableId: number;

  @belongsTo(() => Proforma)
  proformaId: number;


  constructor(data?: Partial<PurchaseOrders>) {
    super(data);
  }
}

export interface PurchaseOrdersRelations {
  // describe navigational properties here
}

export type PurchaseOrdersWithRelations = PurchaseOrders & PurchaseOrdersRelations;
