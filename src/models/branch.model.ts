import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Organization} from './organization.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Branch' // Nombre de la tabla en PostgreSQL
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
export class Branch extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
  })
  id_branch?: number;

  @property({
    type: 'string',
  })
  initial?: string;

  @property({
    type: 'string',
  })
  status?: string;

  @property({
    type: 'string',
  })
  type?: string;

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  address?: string;

  @property({
    type: 'string',
  })
  manager?: string;

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

  @belongsTo(() => Organization)
  organizationId?: number;

  constructor(data?: Partial<Branch>) {
    super(data);
  }
}

export interface BranchRelations {
  // describe navigational properties here
}

export type BranchWithRelations = Branch & BranchRelations;
