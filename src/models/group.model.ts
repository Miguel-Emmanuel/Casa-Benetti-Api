import {model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';

@model({
  settings: {
    postgresql: {
      table: 'catalog_Group' // Nombre de la tabla en PostgreSQL
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
  name?: string;


  constructor(data?: Partial<Group>) {
    super(data);
  }
}

export interface GroupRelations {
  // describe navigational properties here
}

export type GroupWithRelations = Group & GroupRelations;
