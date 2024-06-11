import {belongsTo, model, property} from '@loopback/repository';
import {Address} from './base/address.model';
import {BaseEntity} from './base/base-entity.model';
import {User} from './user.model';

@model({
  settings: {
    postgresql: {
      table: 'user_UserData', // Nombre de la tabla en PostgreSQL
    },
    foreignKeys: {
      fk_user_userId: {
        name: 'fk_user_userId',
        entity: 'User',
        entityKey: 'id',
        foreignKey: 'userid',

      }
    }
  }
})
export class UserData extends BaseEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  cellphone?: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  birthdate?: Date;

  @belongsTo(() => User)
  userId: number;

  @property({
    type: 'object',
  })
  address?: Address;

  constructor(data?: Partial<UserData>) {
    super(data);
  }

}


export interface UserDataRelations {
  // describe navigational properties here
}

export type UserDataWithRelations = UserData & UserDataRelations;


