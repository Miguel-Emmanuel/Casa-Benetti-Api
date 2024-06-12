import {AuthenticationComponent} from '@loopback/authentication';
import {JWTAuthenticationComponent} from '@loopback/authentication-jwt';
import {
  AuthorizationComponent
} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import * as dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import {DbDataSource} from './datasources';
import dbConfig from './datasources/db.datasource.config.json';
import {AuthServiceBindings, BranchServiceBindings, DataSourceBindings, FILE_UPLOAD_SERVICE, OperationHookBindings, PasswordHasherBindings, ResponseServiceBindings, RoleBindings, STORAGE_DIRECTORY, SendgridServiceBindings, TokenServiceBindings, TokenServiceConstants, UserServiceBindings} from './keys';
import {OperationHook} from './operation-hooks';
import {UserCredentialsRepository, UserRepository} from './repositories';
import {MySequence} from './sequence';
import {AuthService, BcryptHasher, BranchService, JWTService, MyUserService, ResponseService, RoleService, SendgridService} from './services';
export {ApplicationConfig};

export class BaseApiLb4Application extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    dotenv.config();

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
    this.bind(RestBindings.ERROR_WRITER_OPTIONS).to({
      debug: false,
      safeFields: ['type'],
    });

    this.configureFileUpload(options.fileStorageDirectory);

    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // ------ ADD SNIPPET AT THE BOTTOM ---------
    // Mount authentication system
    this.component(AuthenticationComponent);
    // Mount jwt component
    this.component(JWTAuthenticationComponent);
    // Mount authorization system
    this.component(AuthorizationComponent);
    this.setupBinding();
  }
  protected setupBinding(): void {
    this.bind(DataSourceBindings.DB_DATASOURCE_CONFIG).to({
      name: dbConfig.name || process.env.DB_NAME,
      url: process.env.DB_URL || dbConfig.url,
      database: process.env.DB_DATABASE || dbConfig.database,
      connector: process.env.DB_CONNECTOR || dbConfig.connector,
      host: process.env.DB_HOST || dbConfig.host,
      port: process.env.DB_PORT || dbConfig.port,
    });
    this.bind(DataSourceBindings.DB_DATASOURCE).toClass(DbDataSource);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);
    this.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.bind(AuthServiceBindings.AUTH_SERVICE).toClass(AuthService);
    this.bind(RoleBindings.ROLE_SERVICE).toClass(RoleService);
    this.bind(BranchServiceBindings.BRANCH_SERVICE).toClass(BranchService);

    //this.bind(ConfigurationBindings.CONFIGURATION_SERVICE).toClass(ConfigurationService);
    this.bind(UserServiceBindings.USER_REPOSITORY).toClass(UserRepository);
    this.bind(UserServiceBindings.USER_CREDENTIALS_REPOSITORY).toClass(UserCredentialsRepository);
    this.bind(UserServiceBindings.USER_SERVICE).toClass(MyUserService);
    // this.bind(ErrorServiceBindings.ERROR_SERVICE).toClass(ErrorService);
    this.bind(ResponseServiceBindings.RESPONSE_SERVICE).toClass(
      ResponseService
    );

    this.bind(OperationHookBindings.OPERATION_SERVICE).toClass(OperationHook);
    this.bind(SendgridServiceBindings.SENDGRID_SERVICE).toClass(
      SendgridService
    );
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(
      TokenServiceConstants.TOKEN_SECRET_VALUE,
    );

    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to(
      TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE ?? "36000",
    );

    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);
  }

  /**
   * Configure `multer` options for file upload
   */
  protected configureFileUpload(destination?: string) {
    // Upload files to `dist/.sandbox` by default
    destination = destination ?? path.join(__dirname, '../.sandbox');
    this.bind(STORAGE_DIRECTORY).to(destination);
    const multerOptions: multer.Options = {
      storage: multer.diskStorage({
        destination,
        // Use the original file name as is
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    };
    // Configure the file upload service with multer options
    this.configure(FILE_UPLOAD_SERVICE).to(multerOptions);
  }
}
