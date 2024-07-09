import {Entity, belongsTo, model, property} from '@loopback/repository';
import {PurchaseOrdersStatus} from '../enums';
import {AccountPayable} from './account-payable.model';
import {Provider} from './provider.model';

@model({
  settings: {
    postgresql: {
      table: 'accountPayable_PurchaseOrders' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_purchaseOrders_providerId: {
        name: 'fk_purchaseOrders_providerId',
        entity: 'Provider',
        entityKey: 'id',
        foreignKey: 'providerid',
      },
      fk_purchaseOrders_accountPayableId: {
        name: 'fk_purchaseOrders_accountPayableId',
        entity: 'AccountPayable',
        entityKey: 'id',
        foreignKey: 'accountpayableid',
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

  //Cantidad de artículos
  @property({
    type: 'number',
    postgresql: {
      dataType: 'double precision',
    },
  })
  quantity: number;

  //Monto total
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  total: number;

  //Estatus
  @property({
    type: 'string',
    required: true,
    default: PurchaseOrdersStatus.PENDIENTE
  })
  status: PurchaseOrdersStatus;

  @belongsTo(() => AccountPayable)
  accountPayableId: number;

  @belongsTo(() => Provider)
  providerId: number;




  constructor(data?: Partial<PurchaseOrders>) {
    super(data);
  }
}

export interface PurchaseOrdersRelations {
  // describe navigational properties here
}

export type PurchaseOrdersWithRelations = PurchaseOrders & PurchaseOrdersRelations;
