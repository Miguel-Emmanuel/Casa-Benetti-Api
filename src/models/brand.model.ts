import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Organization} from './organization.model';
import {ProviderBrand} from './provider-brand.model';
import {Provider} from './provider.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Brand' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_organization_organizationId: {
        name: 'fk_organization_organizationId',
        entity: 'Organization',
        entityKey: 'id',
        foreignKey: 'organizationid',
      },
    }
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

  //estatus
  @property({
    type: 'string',
  })
  status?: string;

  //marca
  @property({
    type: 'string',
  })
  brandName?: string;

  //Nivel Descuento
  @property({
    type: 'string',
  })
  discountLevel?: string;

  //Web
  @property({
    type: 'string',
  })
  website?: string;

  //Descuento
  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  discount?: number;

  //Factor
  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  factor?: number;

  //Tiempo de Producción
  @property({
    type: "number",
    postgresql: {
      dataType: "decimal",
    },
  })
  productionTime?: number;

  @belongsTo(() => Organization)
  organizationId?: number;

  @hasMany(() => Provider, {through: {model: () => ProviderBrand}})
  providers: Provider[];

  // @property({
  //   type: 'number',
  // })
  // providerId?: number;

  // @hasMany(() => Provider)
  // providers: Provider[];

  constructor(data?: Partial<Brand>) {
    super(data);
  }
}

export interface BrandRelations {
  // describe navigational properties here
}

export type BrandWithRelations = Brand & BrandRelations;
