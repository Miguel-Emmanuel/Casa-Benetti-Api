import {TokenService, UserService} from '@loopback/authentication';
import {BindingKey} from '@loopback/core';

import * as dotenv from 'dotenv';
import {DbDataSource} from './datasources';
import {User} from './models';
import {BranchService, WarehouseService} from './services';
import {PasswordHasher} from './services/bcrypt.service';
import {SendgridService} from './services/sendgrid.service';
import {FileUploadHandler} from './types';
dotenv.config();
export interface Credentials {
  email: string;
  username: string;
  password: string;
}

export namespace DataSourceBindings {
  export const DB_DATASOURCE = BindingKey.create<DbDataSource>('datasources.db');
  export const DB_DATASOURCE_CONFIG = BindingKey.create<object>('datasources.config.db');
}

export namespace TokenServiceConstants {
  export const TOKEN_SECRET_VALUE = process.env.TOKEN_SECRET!;
  export const TOKEN_EXPIRES_IN_VALUE = process.env.TOKEN_EXPIRATION_SECONDS!;
}

export namespace TokenServiceBindings {
  export const TOKEN_SECRET = BindingKey.create<string>(
    'authentication.jwt.secret',
  );
  export const TOKEN_EXPIRES_IN = BindingKey.create<string>(
    'authentication.jwt.expires.in.seconds',
  );
  export const TOKEN_SERVICE = BindingKey.create<TokenService>(
    'services.authentication.jwt.tokenservice',
  );
}

export namespace PasswordHasherBindings {
  export const PASSWORD_HASHER = BindingKey.create<PasswordHasher>('service.hasher');
  export const ROUNDS = BindingKey.create<number>('services.hasher.rounds');
}

export namespace UserServiceBindings {
  export const USER_SERVICE =
    BindingKey.create<UserService<User, Credentials>>('services.user.service');
  export const USER_REPOSITORY = 'repositories.UserRepository';
  export const USER_CREDENTIALS_REPOSITORY = 'repositories.UserCredentialsRepository';
}


export namespace AuthProviderBindings {
  export const AUTH_PROVIDER = 'provider.auth';
}

export const FILE_UPLOAD_SERVICE = BindingKey.create<FileUploadHandler>('services.FileUpload');

export namespace EmailServiceBindings {
  export const EMAIL_SERVICE = BindingKey.create<object>('email.service');
}

export namespace AuthServiceBindings {
  export const AUTH_SERVICE = BindingKey.create<object>('auth.service');
}

export namespace RoleBindings {
  export const ROLE_SERVICE = BindingKey.create<object>('role.service');
}

export const STORAGE_DIRECTORY = BindingKey.create<string>('storage.directory');

export namespace ErrorServiceBindings {
  export const ERROR_SERVICE = BindingKey.create<object>('error.service');
}

export namespace ResponseServiceBindings {
  export const RESPONSE_SERVICE = BindingKey.create<object>('response.service');
}

export namespace OperationHookBindings {
  export const OPERATION_SERVICE = BindingKey.create<object>('operation-hook');
}

export namespace SendgridServiceBindings {
  export const SENDGRID_SERVICE = BindingKey.create<SendgridService>(
    'sendgrid.properties'
  );
}

export namespace BranchServiceBindings {
  export const BRANCH_SERVICE = BindingKey.create<BranchService>(
    'branch.service'
  );
}

export namespace WarehouseServiceBindings {
  export const WAREHOUSE_SERVICE = BindingKey.create<WarehouseService>(
    'warehouse.service'
  );
}
