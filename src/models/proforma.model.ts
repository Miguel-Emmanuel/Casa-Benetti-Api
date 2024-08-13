import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {ProformaCurrencyE} from '../enums';
import {AccountPayable} from './account-payable.model';
import {BaseEntity} from './base/base-entity.model';
import {Branch} from './branch.model';
import {Brand, BrandWithRelations} from './brand.model';
import {Document} from './document.model';
import {Project, ProjectWithRelations} from './project.model';
import {Provider, ProviderWithRelations} from './provider.model';
import {PurchaseOrders, PurchaseOrdersWithRelations} from './purchase-orders.model';
import {QuotationProducts, QuotationProductsWithRelations} from './quotation-products.model';

@model({
  settings: {
    postgresql: {
      table: 'project_Proforma' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_proforma_brandId: {
        name: 'fk_proforma_brandId',
        entity: 'Brand',
        entityKey: 'id',
        foreignKey: 'brandid',
      },
      fk_proforma_providerId: {
        name: 'fk_proforma_providerId',
        entity: 'Provider',
        entityKey: 'id',
        foreignKey: 'providerid',
      },
      fk_proforma_projectId: {
        name: 'fk_proforma_projectid',
        entity: 'Project',
        entityKey: 'id',
        foreignKey: 'projectid',
      },
      fk_proforma_branchId: {
        name: 'fk_proforma_branchId',
        entity: 'Branch',
        entityKey: 'id',
        foreignKey: 'branchid',
      },
    }
  }
})
export class Proforma extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  //Id Profoma
  @property({
    type: 'string',
    required: true,
    length: 20,
    jsonSchema: {
      errorMessage: 'El ID debe tener maximo 20 caracteres',
    },
  })
  proformaId: string;

  //Fecha proforma
  @property({
    type: 'date',
    required: true,
    default: () => new Date(),
  })
  proformaDate: Date;

  //Importe proforma
  @property({
    type: 'number',
    required: false,
    postgresql: {
      dataType: 'double precision',
    },
  })
  proformaAmount: number;

  //Moneda
  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      enum: Object.values(ProformaCurrencyE),
    },
  })
  currency: ProformaCurrencyE;

  @belongsTo(() => Branch)
  branchId: number;

  @belongsTo(() => Provider)
  providerId: number;

  @hasOne(() => AccountPayable)
  accountPayable: AccountPayable;

  @hasOne(() => PurchaseOrders)
  purchaseOrders: PurchaseOrdersWithRelations;

  @belongsTo(() => Brand)
  brandId: number;

  @hasOne(() => Document)
  document: Document;

  @belongsTo(() => Project)
  projectId: number;

  @hasMany(() => QuotationProducts)
  quotationProducts: QuotationProducts[];



  constructor(data?: Partial<Proforma>) {
    super(data);
  }
}

export interface ProformaRelations {
  // describe navigational properties here
  project: ProjectWithRelations,
  provider: ProviderWithRelations,
  brand: BrandWithRelations
  quotationProducts: QuotationProductsWithRelations[]

}

export type ProformaWithRelations = Proforma & ProformaRelations;
