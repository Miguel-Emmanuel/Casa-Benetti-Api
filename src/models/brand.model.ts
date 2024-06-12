import {model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Brand' // Nombre de la tabla en PostgreSQL
    },
    // foreignKeys: {
    //   fk_organization_organizationId: {
    //     name: 'fk_organization_organizationId',
    //     entity: 'Organization',
    //     entityKey: 'id',
    //     foreignKey: 'organizationid',
    //   },
    // }
  }
})
export class Brand extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  brandId?: number;

  @property({
    type: 'string',
  })
  status?: string;

  @property({
    type: 'string',
  })
  brandName?: string;

  @property({
    type: 'string',
  })
  discountLevel?: string;

  @property({
    type: 'string',
  })
  website?: string;

  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  discount?: number;

  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  factor?: number;

  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  productionTime?: number;


  constructor(data?: Partial<Brand>) {
    super(data);
  }
}

export interface BrandRelations {
  // describe navigational properties here
}

export type BrandWithRelations = Brand & BrandRelations;
