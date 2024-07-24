import {Entity, belongsTo, model, property} from '@loopback/repository';
import {PurchaseOrdersStatus} from '../enums';
import {AccountPayable} from './account-payable.model';
import {AccountsReceivable} from './accounts-receivable.model';
import {Proforma, ProformaWithRelations} from './proforma.model';

//Ordenes de compra
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
  id: number;

  //Fecha de creacion
  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt: Date;

  //Fecha de término de producción
  @property({
    type: 'date',
  })
  productionEndDate: Date;

  //Estatus
  @property({
    type: 'string',
    required: true,
    default: PurchaseOrdersStatus.NUEVA
  })
  status: PurchaseOrdersStatus;

  @belongsTo(() => AccountsReceivable)
  accountsReceivableId?: number;

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
  proforma: ProformaWithRelations
}

export type PurchaseOrdersWithRelations = PurchaseOrders & PurchaseOrdersRelations;
