import {Entity, property} from '@loopback/repository';

/**
 * Abstract base class for all soft-delete enabled models
 *
 * @description
 * Base class for all soft-delete enabled models created.
 * It adds a 'deleted' attribute to the model class for handling soft-delete.
 * Its an abstract class so no repository class should be based on this.
 */

export abstract class SoftDeleteEntity extends Entity {
  @property({
    type: 'boolean',
    default: false,
  })
  isDeleted?: boolean;

  @property({
    type: 'string',
  })
  deleteComment?: string;

  constructor(data?: Partial<SoftDeleteEntity>) {
    super(data);
  }
}
