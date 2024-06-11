import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Module} from './module.model';
import {Role} from './role.model';

@model({
  settings: {
    postgresql: {
      table: 'role_RoleModule' // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_role_roleId: {
        name: 'fk_role_roleId',
        entity: 'Role',
        entityKey: 'id',
        foreignKey: 'roleid',
      },
      fk_module_moduleId: {
        name: 'fk_module_moduleId',
        entity: 'Module',
        entityKey: 'id',
        foreignKey: 'moduleid',
      },
    }
  }
})
export class RoleModule extends BaseEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'boolean',
    default: false
  })
  create: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  read: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  update: boolean;

  @property({
    type: 'boolean',
    default: false
  })
  del: boolean;

  @belongsTo(() => Role)
  roleId: number;

  @belongsTo(() => Module)
  moduleId: number;

  constructor(data?: Partial<RoleModule>) {
    super(data);
  }
}

export interface RoleModuleRelations {
  // describe navigational properties here
}

export type RoleModuleWithRelations = RoleModule & RoleModuleRelations;
