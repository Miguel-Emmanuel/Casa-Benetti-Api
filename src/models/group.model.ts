import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Customer} from './customer.model';
import {Organization} from './organization.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Group' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_group_organization: {
        name: 'fk_group_organization',
        entity: 'Organization',
        entityKey: 'id',
        foreignKey: 'organizationid',
      },
    }
  }
})
export class Group extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  //Nombre
  @property({
    type: 'string',
  })
  name: string;

  //Descripcion
  @property({
    type: 'string',
  })
  description: string;

  @hasMany(() => Customer)
  customers: Customer[];

  @belongsTo(() => Organization)
  organizationId: number;


  constructor(data?: Partial<Group>) {
    super(data);
  }
}

export interface GroupRelations {
  // describe navigational properties here
}

export type GroupWithRelations = Group & GroupRelations;
