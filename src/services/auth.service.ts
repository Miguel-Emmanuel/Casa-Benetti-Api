import {TokenService} from '@loopback/authentication';
import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import {Credentials, PasswordHasherBindings, ResponseServiceBindings, SendgridServiceBindings, UserServiceBindings} from '../keys';
import {ModuleRepository, RoleModuleRepository, RoleRepository, UserRepository} from '../repositories';
import {BcryptHasher} from './bcrypt.service';
import {ResponseService} from './response.service';
import {SendgridService, SendgridTemplates} from './sendgrid.service';
import {MyUserService} from './user.service';

interface RequestResetPassword {
  email: string;
}

interface ResetPassword {
  token: string;
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(RoleModuleRepository)
    public roleModuleRepository: RoleModuleRepository,
    @repository(ModuleRepository)
    public moduleRepository: ModuleRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @inject(SendgridServiceBindings.SENDGRID_SERVICE)
    public sendgridService: SendgridService,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
  ) { }

  async login(credentials: Credentials) {
    // ensure the user exists, and the password is correct
    const userVerified = await this.userService.verifyCredentials(credentials);
    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(userVerified, userVerified.organizationId);
    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);
    const user = await this.userRepository.findById(userVerified?.id, {
      include: [
        {
          relation: 'userData',
          scope: {
            fields: ['id', 'imageURL', 'userRoleId'],
          }
        }],

    });


    const userRole = await this.roleRepository.findOne({
      where: {id: user.roleId},
      fields: ['id', 'name', 'description', 'isActive', 'accessLevel'],
    })

    const roleModules = await this.roleModuleRepository.find({
      where: {roleId: user.roleId},
      include: [{relation: 'module', scope: {fields: ['name', 'description', 'categoryName']}}],
      fields: ['create', 'read', 'update', 'del', 'moduleId']
    })

    const groupList = roleModules.reduce((previousValue: any, currentValue: any) => {
      const {module, ...current} = currentValue;
      if (!module)
        return previousValue;

      (previousValue[module.categoryName] = previousValue[module.categoryName] || []).push(currentValue);
      return previousValue;
    }, {});

    const list = Object.keys(groupList);
    const newList = list?.map(module => ({
      category: module,
      modules: groupList[module]
    }))

    return {...user, userRole: {...userRole, roleModules: newList}, token};

  }

  async requestResetPassword(requestResetPassword: RequestResetPassword) {
    try {
      const {email} = requestResetPassword;
      this.userService.validateEmailFormat(email)
      const lowerCaseEmail = requestResetPassword.email.toLowerCase();
      const userToResetPassword = await this.userRepository.findOne({
        where: {email: lowerCaseEmail, isDeleted: false},
        include: [{relation: 'userData'}],
      });

      if (!userToResetPassword?.userDataId) return this.responseService.badRequest('El correo no está registrado en el sistema. Compruebe la información e inténtelo de nuevo.')
      if (!userToResetPassword?.isActive) return this.responseService.badRequest('¡Oh, no! el usuario con el que intentas acceder está desactivado, por lo tanto no puedes realizar esta acción. Por favor, contacta a tu administrador.')

      if (userToResetPassword) {
        const hash = bcrypt.hashSync('}*/.,41-a[wRñ{1337}|', 8).toString();
        const token = Buffer.from(hash).toString('base64');
        const linkResetPassword = `${process.env.URL_FRONTEND}/login?token=${token}`;


        const options = {
          to: requestResetPassword.email,
          templateId: SendgridTemplates.USER_RESET_PASSWORD.id,
          dynamicTemplateData: {
            url: linkResetPassword,
            subject: SendgridTemplates.USER_RESET_PASSWORD.subject
          },
        };

        const now = dayjs().format();
        if (dayjs(now).isAfter(userToResetPassword.tokenExpiration) || !userToResetPassword.resetPasswordToken) {
          await this.userRepository.updateById(userToResetPassword.id, {
            resetPasswordToken: token,
            tokenExpiration: dayjs().add(10, 'minutes').toDate(),
          });

          await this.sendgridService.sendNotification(
            options
          );
          return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
        } else {
          return this.responseService.badRequest('Debes esperar 15 minutos para volver a realizar la solicitud.');
        }
      } else {
        return this.responseService.badRequest('El correo no está registrado en el sistema. Compruebe la información e inténtelo de nuevo.');
      }
    } catch (error) {
      console.log(error)
      throw this.responseService.badRequest(error);
      if (error.code !== undefined) {
        throw error;
      }
    }
  }

  async resetPassword(resetPassword: ResetPassword, token: string) {
    try {
      this.userService.validateBodyResetPassword(resetPassword)
      this.userService.validateFormatPassword(resetPassword.password)
      this.userService.validateFormatPassword(resetPassword.confirmPassword)
      if (resetPassword.password !== resetPassword.confirmPassword) {
        return this.responseService.badRequest("¡Oh, no! La nueva contraseña y la confirmación no coinciden. Por favor verifica e intenta de nuevo");
      }
      const userByToken = !resetPassword.token ? await this.userService.findUserByToken(token) : await this.userRepository.findOne({
        where: {resetPasswordToken: resetPassword.token, isActive: true, isDeleted: false},
        include: [{relation: 'userData'}],
      });
      if (!userByToken)
        return this.responseService.badRequest('No existen datos relacionados');
      if (resetPassword?.currentPassword) {
        await this.userService.verifyCredentials({
          email: userByToken.email,
          password: resetPassword.currentPassword,
          username: ''
        });
      }
      const now = dayjs();
      if (token) {
        // eslint-disable-next-line require-atomic-updates
        const hashPassword = await this.hasher.hashPassword(resetPassword.password);
        await this.userRepository
          .userCredentials(userByToken.id)
          .patch({password: hashPassword});
        await this.userRepository.updateById(userByToken.id, {
          resetPasswordToken: '',
          tokenExpiration: now.toDate(),
        });
        const options = {
          to: userByToken.email,
          templateId: SendgridTemplates.USER_PASSWORD_CHANGED.id,
          dynamicTemplateData: {
            subject: SendgridTemplates.USER_PASSWORD_CHANGED.subject,
            password: resetPassword.password,
            username: `${userByToken?.firstName} ${userByToken?.lastName}`
          },
        };
        await this.sendgridService.sendNotification(
          options
        );
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
      } else {
        if (dayjs(userByToken.tokenExpiration).isAfter(now)) {
          // eslint-disable-next-line require-atomic-updates
          const hashPassword = await this.hasher.hashPassword(resetPassword.password);
          await this.userRepository
            .userCredentials(userByToken.id)
            .patch({password: hashPassword});
          await this.userRepository.updateById(userByToken.id, {
            resetPasswordToken: '',
            tokenExpiration: now.toDate(),
          });
          const options = {
            to: userByToken.email,
            templateId: SendgridTemplates.USER_PASSWORD_CHANGED.id,
            dynamicTemplateData: {
              subject: SendgridTemplates.USER_PASSWORD_CHANGED.subject,
              buttonURL: process.env.PAGE_URL,
              password: resetPassword.password,
              username: `${userByToken?.firstName} ${userByToken?.lastName}`
            },
          };
          await this.sendgridService.sendNotification(
            options
          );
          return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
        } else {
          return this.responseService.badRequest('Por favor verifica los datos, o el token ha expirado');
        }
      }


    } catch (error) {
      return this.responseService.badRequest(error);
      if (error.code !== undefined) {
        throw error;
      }
    }
  }

  async hasPermissions(body: {module: string}, token: string) {
    const getUserByToken = this.userService.getTokenData(token);
    const user = await this.userRepository.findById(getUserByToken?.id, {
      include: [
        {
          relation: 'userData',
          scope: {
            fields: ['id', 'imageURL', 'userRoleId'],
          }
        }],

    });

    const module = await this.moduleRepository.findOne({
      where: {name: body.module},
    })

    if (!module) return this.responseService.forbbiden("No se ha encontrado el modulo")

    let roleModule: any;
    try {
      if (user.isSuperAdmin) {
        roleModule = await this.roleModuleRepository.findOne({
          where: {moduleId: module?.id},
          include: [{relation: 'module', scope: {fields: ['name', 'description', 'categoryName']}}],
          fields: ['create', 'read', 'update', 'del']
        })
        roleModule.create = true;
        roleModule.update = true;
        roleModule.del = true;
        roleModule.read = true;

      } else {
        roleModule = await this.roleModuleRepository.findOne({
          where: {roleId: user.roleId, moduleId: module?.id},
          include: [{relation: 'module', scope: {fields: ['name', 'description', 'categoryName']}}],
          fields: ['create', 'read', 'update', 'del']
        })
      }

      if (!roleModule) return this.responseService.forbbiden("No se han encontrado modulos")

      return roleModule;
    } catch (error) {
      if (error.message === "Cannot set properties of null (setting 'create')")
        return this.responseService.notFound("No se pudo encontrar el <roleModule>")
      return this.responseService.internalServerError(error.message ? error.message : error)
    }

  }
}
