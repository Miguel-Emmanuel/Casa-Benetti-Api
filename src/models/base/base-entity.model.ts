import {model, property} from '@loopback/repository';
import {SoftDeleteEntity} from './soft-delete-entity.model';

@model()
export abstract class BaseEntity extends SoftDeleteEntity {

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: Date;

  @property({
    type: 'number',
  })
  createdBy?: number | object;

  @property({
    type: 'number',
  })
  updatedBy?: number | object;

  @property({
    type: 'date',
    default: () => new Date()
  })
  updatedAt?: Date;

  constructor(data?: Partial<BaseEntity>) {
    super(data);
  }
}

export interface BaseEntityRelations {
  // describe navigational properties here
}

export type BaseEntityWithRelations = BaseEntity & BaseEntityRelations;
