import {hasMany, model, property} from '@loopback/repository';
import {AccessLevelRolE} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {User} from './user.model';

@model({
  settings: {
    postgresql: {
      table: 'role_Role' // Nombre de la tabla en PostgreSQL
    }
  }
})
export class Role extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
  })
  description: string;

  @property({
    type: 'string',
  })
  accessLevel: AccessLevelRolE;

  @property({
    type: 'number',
  })
  organizationId?: number;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  @property({
    type: 'string',
  })
  activateDeactivateComment?: string;

  @hasMany(() => User)
  users: User[];

  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;
