import {TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {param, post, requestBody} from '@loopback/rest';
import {AuthServiceBindings, Credentials, PasswordHasherBindings, ResponseServiceBindings, SendgridServiceBindings, UserServiceBindings} from '../keys';
import {User} from '../models';
import {OrganizationRepository, RoleModuleRepository, RoleRepository, UserDataRepository, UserRepository} from '../repositories';
import {AuthService, BcryptHasher, MyUserService, ResponseService} from '../services';
import {SendgridService} from '../services/sendgrid.service';

export interface ResetPassword {
  token: string;
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

interface RequestResetPassword {
  email: string;
}

export class AuthController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(UserDataRepository)
    public userDataRepository: UserDataRepository,
    @repository(OrganizationRepository)
    public organizationRepository: OrganizationRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER) public hasher: BcryptHasher,
    @repository(RoleModuleRepository)
    public roleModuleRepository: RoleModuleRepository,
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @inject(SendgridServiceBindings.SENDGRID_SERVICE)
    public sendgridService: SendgridService,
    @inject(AuthServiceBindings.AUTH_SERVICE)
    public authService: AuthService,
  ) { }

  @post('/auth/login', {
    responses: {
      '200': {
        description: 'AppUser Signup',
        content: {
          'application/json': {
            schema: {
              'x-ts-type': User,
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      description: 'The input of login',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {type: 'string'},
              password: {type: 'string'},
            },
          },
        },
      },
    })
    credentials: Credentials
  ) {
    return this.authService.login(credentials)
  }

  @post('/auth/request-reset-password')
  async requestResetPassword(
    @requestBody({
      description: 'The input of request reset password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {type: 'string', example: "user@example.com"}
            },
          },
        },
      },
    })
    requestResetPassword: RequestResetPassword
  ): Promise<object> {
    return this.authService.requestResetPassword(requestResetPassword)
  }

  @post('/auth/reset-password')
  async resetPassword(
    @requestBody({
      description: 'The input of reset password',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {type: 'string'},
              currentPassword: {type: 'string'},
              password: {type: 'string'},
              confirmPassword: {type: 'string'}
            },
          },
        },
      },
    })
    resetPassword: ResetPassword,
    @param.header.string('authorization') token: string
  ): Promise<object> {
    // user reset password intent
    return this.authService.resetPassword(resetPassword, token)
  }
}
