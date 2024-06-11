import {Entity, hasMany, model, property} from '@loopback/repository';

import {ModuleCategories} from '../enums';
import {RoleModule} from './role-module.model';

@model({
  settings: {
    postgresql: {
      table: 'role_Module' // Nombre de la tabla en PostgreSQL
    }
  }
})
export class Module extends Entity {
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
  name?: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(ModuleCategories),
    },
  })
  categoryName?: ModuleCategories;

  @hasMany(() => RoleModule)
  roleModules: RoleModule[];

  constructor(data?: Partial<Module>) {
    super(data);
  }
}

export interface ModuleRelations {
  // describe navigational properties here
}

export type ModuleWithRelations = Module & ModuleRelations;
