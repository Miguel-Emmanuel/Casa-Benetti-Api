import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {
      table: 'accountPayable_AccountPayableHistory' // Nombre de la tabla en PostgreSQL
    },
    // foreignKeys: {
    //     fk_quotation_quotationId: {
    //         name: 'fk_quotation_quotationId',
    //         entity: 'Quotation',
    //         entityKey: 'id',
    //         foreignKey: 'quotationid',
    //     },
    //     fk_product_productId: {
    //         name: 'fk_product_productId',
    //         entity: 'Product',
    //         entityKey: 'id',
    //         foreignKey: 'productid',
    //     },
    // }
  }
})
export class AccountPayableHistory extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  // Fecha proforma
  @property({
    type: 'string',
    required: true,
  })
  proformaDate: string;

  // No. Proforma
  @property({
    type: 'string',
    required: true,
  })
  proformaNumber: string;

  // Moneda
  @property({
    type: 'string',
    required: true,
  })
  currency: string;

  // Importe proforma
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },

  })
  proformaAmount: number;

  // Fecha de pago
  @property({
    type: 'string',
    required: true,
  })
  paymentDate: string;

  // Monto anticipo
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  advancePaymentAmount: number;

  // Saldo
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  balance: number;

  // Estatus
  @property({
    type: 'number',
    required: true,
  })
  status: number;


  constructor(data?: Partial<AccountPayableHistory>) {
    super(data);
  }
}

export interface AccountPayableHistoryRelations {
  // describe navigational properties here
}

export type AccountPayableHistoryWithRelations = AccountPayableHistory & AccountPayableHistoryRelations;
