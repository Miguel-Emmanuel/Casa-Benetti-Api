import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Brand} from './brand.model';
import {Provider} from './provider.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_ProviderBrand' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_brand_brandId: {
        name: 'fk_brand_brandId',
        entity: 'Brand',
        entityKey: 'id',
        foreignKey: 'brandid',
      },
      fk_provider_providerId: {
        name: 'fk_provider_providerId',
        entity: 'Provider',
        entityKey: 'id',
        foreignKey: 'providerid',
      },
    }
  }
})
export class ProviderBrand extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;
  @belongsTo(() => Brand)
  brandId: number;

  @belongsTo(() => Provider)
  providerId: number;

  constructor(data?: Partial<ProviderBrand>) {
    super(data);
  }
}

export interface ProviderBrandRelations {
  // describe navigational properties here
}

export type ProviderBrandWithRelations = ProviderBrand & ProviderBrandRelations;
