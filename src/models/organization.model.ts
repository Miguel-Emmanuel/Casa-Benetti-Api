import {Entity, hasMany, model, property} from '@loopback/repository';
import {Role} from './role.model';
import {User} from './user.model';

@model({
  settings: {
    postgresql: {
      table: 'org_Organization' // Nombre de la tabla en PostgreSQL
    }
  }
})
export class Organization extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt: Date;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @property({
    type: 'boolean',
    default: true,
  })
  canUpdate: boolean;

  @property({
    type: 'string',
  })
  description?: string;

  @hasMany(() => User)
  users: User[];

  @hasMany(() => Role)
  roles: Role[];

  constructor(data?: Partial<Organization>) {
    super(data);
  }
}

export interface OrganizationRelations {
  // describe navigational properties here
}

export type OrganizationWithRelations = Organization & OrganizationRelations;
