import {Entity, model, property} from '@loopback/repository';

// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/authentication-jwt
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
@model({
  settings: {
    postgresql: {
      table: 'user_UserCredentials', // Nombre de la tabla en PostgreSQL,
    },
    foreignKeys: {
      fk_user_userId: {
        name: 'fk_user_userId',
        entity: 'User',
        entityKey: 'id',
        foreignKey: 'userid',
      },
    }
  }
})
export class UserCredentials extends Entity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'number',
  })
  userId?: number;

  constructor(data?: Partial<UserCredentials>) {
    super(data);
  }
}

export interface UserCredentialsRelations {
  // describe navigational properties here
}

export type UserCredentialsWithRelations = UserCredentials & UserCredentialsRelations;
