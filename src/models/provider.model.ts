import {Model, belongsTo, hasMany, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {BaseEntity} from './base/base-entity.model';
import {Brand} from './brand.model';
import {Organization} from './organization.model';
import {ProviderBrand} from './provider-brand.model';

@model()
class TaxData extends Model {

  // RFC / Tax ID
  @property({
    type: 'string',
  })
  rfc?: string;

  // Razón Social
  @property({
    type: 'string',
  })
  businessName?: string;

  // Ubicación
  @property({
    type: 'string',
  })
  location?: string;
}

@model()
export class ShowroomCredit extends Model {

  // Crédito Showroom
  @property({
    type: 'string',
  })
  nameShowroomCredit?: string;

  // Días de Crédito
  @property({
    type: 'string',
  })
  creditDays?: string;

  // Condiciones de Anticipo
  @property({
    type: 'string',
  })
  advanceConditions?: string;
}

@model()
export class ContactInformation extends Model {

  // Nombre
  @property({
    type: 'string',
  })
  name?: string;

  // Email
  @property({
    type: 'string',
    jsonSchema: {
      format: 'email',
      errorMessage: 'Debe ser un correo electrónico válido',
    },
  })
  email?: string;

  // Teléfono
  @property({
    type: 'string',
    jsonSchema: {
      maxLength: 10,
      minLength: 10,
      errorMessage: {
        minLength: 'El teléfono debe contener 10 dígitos',
        maxLength: 'El teléfono debe contener 10 dígitos',
      },
    }
  })
  phone?: string;

}

@model({
  settings: {
    postgresql: {
      table: 'catalog_Provider' // Nombre de la tabla en PostgreSQL
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
export class Provider extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  providerId?: number;

  @property({
    type: 'string',
  })
  status?: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'object',
    jsonSchema: getJsonSchema(TaxData),
  })
  taxData?: TaxData;

  @property({
    type: 'object',
    jsonSchema: getJsonSchema(ShowroomCredit),
  })
  showroomCredit?: ShowroomCredit;

  @property({
    type: 'object',
    jsonSchema: getJsonSchema(ContactInformation),
  })
  contactInformation?: ContactInformation;

  @belongsTo(() => Organization)
  organizationId?: number;

  @hasMany(() => Brand, {through: {model: () => ProviderBrand}})
  brands: Brand[];

  constructor(data?: Partial<Provider>) {
    super(data);
  }
}

export interface ProviderRelations {
  // describe navigational properties here
}

export type ProviderWithRelations = Provider & ProviderRelations;
