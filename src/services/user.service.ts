import {TokenService, UserService} from '@loopback/authentication';
import {TokenServiceBindings, UserRelations} from '@loopback/authentication-jwt';
import {inject} from '@loopback/core';
import {Filter, FilterExcludingWhere, Where, repository} from '@loopback/repository';
import {UserProfile, securityId} from '@loopback/security';

import {customAlphabet} from 'nanoid';
// import {ResetPassword} from '../controllers';
import {LogModificationType} from '../enums';
import {Credentials, PasswordHasherBindings, ResponseServiceBindings, SendgridServiceBindings} from '../keys';
import {UserData} from '../models';
import {User} from '../models/user.model';
import {OrganizationRepository, RoleModuleRepository, RoleRepository, UserDataRepository, UserRepository} from '../repositories';
import {BcryptHasher, ResponseService} from './';
import {SendgridService, SendgridTemplates} from './sendgrid.service';

export interface ResetPassword {
  token: string;
  password: string;
  currentPassword: string;
  confirmPassword: string;
}

const passwordGenerator = customAlphabet('0123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', 6);

export class MyUserService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @repository(OrganizationRepository)
    public organizationRepository: OrganizationRepository,
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @repository(UserDataRepository)
    public userDataRepository: UserDataRepository,
    @inject(SendgridServiceBindings.SENDGRID_SERVICE)
    public sendgridService: SendgridService,
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,
    @repository(RoleModuleRepository)
    public roleModuleRepository: RoleModuleRepository,
  ) { }
  async verifyCredentials(credentials: Credentials): Promise<User> {

    const {email} = credentials;
    //Verificar parametros requeridos del body
    this.validateBodyLogin(credentials);
    //Validar con regex si el formato del correo es el correcto
    this.validateEmailFormat(email)

    let foundUser: (User & UserRelations) | undefined | null = undefined;
    if (credentials.email !== undefined) {
      const foundUserEmail = await this.userRepository.findOne({
        where: {email: credentials.email},
        include: [{relation: 'userCredentials'}],
      });
      foundUser = foundUserEmail;
    } else if (
      credentials.username !== undefined &&
      (foundUser === undefined || foundUser === null)
    ) {
      const foundUserUsername = await this.userRepository.findOne({
        where: {username: credentials.username},
        include: [{relation: 'userCredentials'}],
      });
      foundUser = foundUserUsername;
    }

    if (foundUser === undefined || foundUser === null) {
      throw this.responseService.unauthorized("Lo sentimos, el email o contraseña no son correctos. Comprueba la información e intentalo de nuevo.")
    }
    const passwordMatch = await this.hasher.comparePassword(
      credentials.password,
      foundUser.userCredentials.password
    );
    if (!passwordMatch) {
      throw this.responseService.unauthorized("Lo sentimos, el email o contraseña no son correctos. Comprueba la información e intentalo de nuevo.")
    }

    if (!foundUser.isActive)
      throw this.responseService.unauthorized('Oh, no! El usuario con el que intentas acceder está inactivo, por lo tanto no puedes iniciar sesión. Por favor, contacta a tu administrador e intenta de nuevo.')

    return foundUser;
  }
  convertToUserProfile(user: User, organizationId?: number): UserProfile {
    let userName = '';
    if (user.firstName) {
      userName = user.firstName;
    }
    if (user.lastName) {
      userName = user.firstName ? `${user.firstName} ${user.lastName} ` : user.lastName;
    }
    if (userName === '' && user.username) {
      userName = user.username;
    }
    const userProfile: UserProfile = {
      [securityId]: `${user.id}`,
      email: user.email,
      name: userName,
      organizationId,
    };

    return userProfile;
  }

  async findUserByToken(token: string): Promise<(User & UserRelations | undefined)> {
    token = token.replace("Bearer ", "");
    const userTokenData = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (userTokenData) {
      const user = await this.userRepository.findOne({
        where: {id: userTokenData.id},
        include: [{relation: 'userData'}],
      });
      return user ?? undefined;
    }

    return undefined;
  }

  getTokenData = getTokenData

  validateEmailFormat = (email: string) => {
    const emailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!email.match(emailFormat))
      throw this.responseService.unprocessableEntity(`El correo debe tener una estructura válida ${email}`)
  }

  validateBodyLogin = (credentials: Credentials) => {
    const {email, password} = credentials;
    if (!email || !password)
      throw this.responseService.unprocessableEntity("Dato requerido")
  }

  validateBodyResetPassword = (resetPassword: ResetPassword) => {
    const {confirmPassword, password} = resetPassword;
    if (!confirmPassword || !password)
      throw this.responseService.unprocessableEntity("Dato requeridosss")
  }

  validateFormatPassword(password: string) {
    const passwordFormat = /^(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    if (!password.match(passwordFormat))
      throw this.responseService.unprocessableEntity("La contraseña debe tener 8 caracteres como mínimo, una letra mayúscula y un caracter especial (#%@_)")
  }

  // async validateBodyCreateUser(body: {user: User, userData: UserData}) {
  //   try {
  //     const value = await schemaCreateUser.validateAsync(body);
  //   }
  //   catch (err) {
  //     const {details} = err;
  //     const {context: {key, value}, message} = details[0];
  //     if (message.includes('is not allowed to be empty'))
  //       throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)

  //     throw this.responseService.unprocessableEntity(message)
  //   }
  // }

  async create(body: {user: (User & {password?: string}), userData: UserData}, token: string) {
    const {organizationId} = this.getTokenData(token);
    const {user, userData} = body;

    if (!userData) return this.responseService.badRequest('¡Oh, no! Hubo un error al momento de crear los datos de un nuevo usuario, valide los datos y vuelva a intentarlo por favor');
    const {email} = user;

    const emailValidator = await this.userRepository.find({
      where: {email: user.email?.toLowerCase()}
    });

    if (emailValidator.length !== 0)
      return this.responseService.badRequest('El correo ya está registrado en el sistema. Compruebe la información e inténtelo de nuevo');

    const orgValidator = await this.organizationRepository.findById(organizationId);

    if (!orgValidator || !orgValidator.isActive) {
      return this.responseService.badRequest('¡Oh, no! La organización no es válida o está desactivada, revisa por favor e intenta de nuevo.');
    }

    const userRole = await this.roleRepository.findOne({where: {id: user.roleId, isActive: true}})
    if (!userRole)
      return this.responseService.badRequest('¡Oh, no! El rol no es válida o está desactivada, revisa por favor e intenta de nuevo.');



    //user.tokenExpiration = moment().add(24, 'hours').toDate();
    user.password = !user.password ? passwordGenerator(8) : user.password;
    const password = await this.hasher.hashPassword(user.password);
    const decryptedPassword = user.password;
    delete user.password;
    const savedUser = await this.userRepository.create({...user, email: email?.toLowerCase(), organizationId, isActive: true});

    try {
      const savedUserData = await this.userDataRepository.create({...userData, userId: savedUser.id});
      await this.userRepository.userCredentials(savedUser.id).create({password});
      await this.userRepository.updateById(savedUser.id, {userDataId: savedUserData.id});

      const options = {
        to: email,
        templateId: SendgridTemplates.NEW_USER.id,
        dynamicTemplateData: {
          subject: SendgridTemplates.NEW_USER.subject,
          name: `${savedUser.firstName} ${savedUser.lastName}`,
          username: email,
          password: decryptedPassword,
          url: process.env.URL_FRONTEND
        },
      };

      await this.sendgridService.sendNotification(
        options
      );

      return this.responseService.ok({user: savedUser, userData: savedUserData});
    } catch (error) {

      if (error.details.context === "userData") {
        const deleteUser = await this.userRepository.deleteById(savedUser.id);
        const deleteCredentials = await this.userRepository.userCredentials(savedUser.id).delete();
        return this.responseService.badRequest('¡Oh, no! Hubo un error al momento de crear los datos de un nuevo usuario, valide los datos y vuelva a intentarlo por favor')
      }

      return this.responseService.badRequest(error.message);
    }
  }

  async deleteByIdUser(id: number) {
    const user = await this.userRepository.findOne({where: {id}});
    if (!user)
      return this.responseService.notFound('El usuario no se a encontrado.')

    await this.userRepository.deleteById(id);
    return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'})
  }

  // async validateUpdateUser(body: {user: User, userData: UserData, documents: [Document]}) {
  //   try {
  //     const value = await schemaUpdateUser.validateAsync(body);
  //   }
  //   catch (err) {
  //     const {details} = err;
  //     const {context: {key, value}, message} = details[0];
  //     if (message.includes('is not allowed to be empty'))
  //       throw this.responseService.unprocessableEntity(`Dato requerido: ${key}`)
  //     throw this.responseService.unprocessableEntity(message)
  //   }
  // }

  async editUser(id: number, body: {user: User, userData: UserData}, token: string) {
    const tokenData = this.getTokenData(token);
    const {user, userData} = body;
    const userFind = await this.userRepository.findOne({where: {id}})
    if (!userFind)
      return this.responseService.badRequest('¡Oh, no! El usuario no es valido o esta desactivado, valide los datos y vuelva a intentarlo por favor');

    const emailValidator = await this.userRepository.find({
      where: {and: [{email: user.email?.toLowerCase()}, {id: {neq: id}}]}
    });

    if (emailValidator.length) return this.responseService.badRequest('¡Oh, no! El correo electrónico que intentas utilizar ya está vinculado a otra cuenta, por favor intenta con otro diferente');


    if (!userData) return this.responseService.badRequest('¡Oh, no! Hubo un error al momento de crear los datos de un nuevo usuario, valide los datos y vuelva a intentarlo por favor');

    if (user.isAdmin === false) {
      const userRole = await this.roleRepository.findOne({where: {id: user.roleId, isActive: true}})
      if (!userRole)
        return this.responseService.badRequest('¡Oh, no! El rol no es válida o está desactivada, revisa por favor e intenta de nuevo.');
    }

    const oldData = await this.userRepository.findById(id);
    const systemUserOldData = await this.userDataRepository.findById(oldData.userDataId);

    if (!user.avatar)
      user.avatar = undefined;
    await this.userRepository.updateById(id, user);


    await this.userDataRepository.updateById(systemUserOldData.id, userData);
    return this.responseService.ok({user, userData});
  }

  async count(token: string, where?: Where<User>) {
    const {organizationId} = this.getTokenData(token);
    await this.validateIfOrganizationIsActiveAndExist(organizationId);
    where = {...where, organizationId}
    return this.userRepository.count(where);
  }
  async validateIfOrganizationIsActiveAndExist(organizationId: number) {
    const organization = await this.organizationRepository.findOne({where: {id: organizationId, isActive: true}})
    if (!organization)
      throw this.responseService.badRequest('¡Oh, no! La organización no es válida o está desactivada, revisa por favor e intenta de nuevo.');
  }

  async find(token: string, filter?: Filter<User>) {
    const {organizationId} = this.getTokenData(token);
    await this.validateIfOrganizationIsActiveAndExist(organizationId);
    if (filter?.where)
      filter.where = {...filter.where, organizationId}
    else
      filter = {...filter, where: {organizationId}};
    const user = await this.userRepository.find(filter);
    return user;
  }

  async findUsersFilterRole(token: string) {
    const {organizationId, id} = this.getTokenData(token);
    await this.validateIfOrganizationIsActiveAndExist(organizationId);
    const usersRoles: any = {};
    const userSuperAdmin = await this.userRepository.findOne({where: {id, isSuperAdmin: true}});
    if (userSuperAdmin) {
      usersRoles["SuperAdmin"] = [{
        id: userSuperAdmin.id,
        name: `${userSuperAdmin.firstName} ${userSuperAdmin.lastName}`,
        avatar: userSuperAdmin.avatar,
        isActive: userSuperAdmin.isActive,
        activateDeactivateComment: userSuperAdmin.activateDeactivateComment,
        email: userSuperAdmin.email
      }];
    }
    const usersAdmin = await this.userRepository.find({where: {id: {neq: id}, organizationId, isAdmin: true}});
    const usersAdminFormat = usersAdmin.map((value: any) => {
      return {
        id: value.id,
        name: `${value.firstName} ${value.lastName}`,
        avatar: value.avatar,
        isActive: value.isActive,
        activateDeactivateComment: value.activateDeactivateComment,
        email: value.email
      }
    })
    usersRoles["Administradores"] = usersAdminFormat;

    const userRole = await this.roleRepository.find({where: {organizationId, name: {neq: "SUPER ADMIN"}}})
    for (let index = 0; index < userRole.length; index++) {
      const element = userRole[index];
      const user = await this.userRepository.find({where: {id: {neq: id}, organizationId, roleId: element.id}});
      const userFormat = user.map((value: any) => {
        return {
          id: value.id,
          name: `${value.firstName} ${value.lastName}`,
          avatar: value.avatar,
          isActive: value.isActive,
          activateDeactivateComment: value.activateDeactivateComment,
          email: value.email
        }
      })
      usersRoles[element.name] = userFormat;

    }
    return usersRoles;
  }

  async findById(id: number, token: string, filter?: FilterExcludingWhere<User>) {
    const {organizationId} = this.getTokenData(token);;
    await this.validateIfOrganizationIsActiveAndExist(organizationId);
    if (filter?.include)
      filter.include = [...filter.include, {relation: 'userData', scope: {include: [{relation: 'documents', scope: {fields: ['id', 'fileURL', 'name', 'extension', 'userDataId', 'createdBy', 'updatedBy', 'createdAt']}}]}}]
    else
      filter = {...filter, include: [{relation: 'userData', scope: {include: [{relation: 'documents', scope: {fields: ['id', 'fileURL', 'name', 'extension', 'userDataId', 'createdBy', 'updatedBy', 'createdAt']}}]}}]};
    const user: any = await this.userRepository.findOne({where: {id, organizationId}, ...filter});
    if (!user)
      throw this.responseService.notFound('El usuario no ha sido encontrado.')

    const createdBy = await this.userRepository.findByIdOrDefault(user.createdBy);
    const updatedBy = await this.userRepository.findByIdOrDefault(user.updatedBy);
    user.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
    user.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
    if (user?.userData?.documents) {
      for (let index = 0; index < user.userData.documents.length; index++) {
        const element = user.userData.documents[index];
        const createdBy = await this.userRepository.findByIdOrDefault(element.createdBy);
        const updatedBy = await this.userRepository.findByIdOrDefault(element.updatedBy);
        element.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
        element.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
      }
    }
    return user;
  }

  async getSysUserData(id: typeof User.prototype.id, token: string) {
    const {organizationId} = this.getTokenData(token);
    await this.validateIfOrganizationIsActiveAndExist(organizationId);
    const user = await this.userRepository.findOne({where: {id, organizationId}});
    if (!user)
      throw this.responseService.notFound('El usuario no ha sido encontrado.')
    return this.userRepository.userData(id);
  }

  async findByToken(token: string) {
    const userInSession = await this.findUserByToken(token);
    if (!userInSession)
      return this.responseService.notFound('El usuario no se encuentra.')

    const user = await this.userRepository.findById(userInSession?.id, {
      include: [
        {
          relation: 'userData',
          scope: {
            fields: ['id', 'imageURL', 'userRoleId', 'organizationId'],
          }
        }],

    });
    if (user.isDeleted === true)
      return this.responseService.notFound('El usuario no se encuentra.')
    if (!user.isActive) {
      return this.responseService.unauthorized('Esta cuenta se encuentra desactivada');
    }

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.convertToUserProfile(user, user.organizationId);
    // create a JSON Web Token based on the user profile
    const newToken = await this.jwtService.generateToken(userProfile);

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

    return {...user, userRole: {...userRole, roleModules: newList}, token: newToken};
  }

  async deleteById(body: {activateDeactivateComment: string}, token: string, id: number,) {
    const tokenData = this.getTokenData(token);

    if (Number(tokenData.id) === id) return this.responseService.badRequest('No se puede desactivar asimismo');
    if (!body.activateDeactivateComment) return this.responseService.badRequest(`El comentario de activación/desactivación es requerido`);

    const userToUpdate = await this.userRepository.findOne({
      where: {
        id: id
      },
      include: [{relation: 'userData'}]
    });

    if (!userToUpdate) return this.responseService.badRequest('El usuario no ha sido encontrado');

    const usersByOrganizationData = await this.userRepository.find({
      where: {
        organizationId: userToUpdate.organizationId
      }
    });
    const activeUsersByOrganizationData = usersByOrganizationData.filter(u => u?.isActive === true && u?.isDeleted === false);

    const modificationType = userToUpdate?.isActive ? LogModificationType.DEACTIVATE : LogModificationType.ACTIVATE;

    if (activeUsersByOrganizationData.length <= 1 && modificationType === 'Deactivate') return this.responseService.badRequest('No se puede desactivar el usuario debido a que es el único activo');
    await this.userRepository.updateById(userToUpdate?.id, {isActive: !userToUpdate?.isActive, activateDeactivateComment: body.activateDeactivateComment});
    return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
  }

}

export const getTokenData = (token: string): {
  id: number,
  name: string,
  email: string,
  organizationId: number,
  iat: number,
  exp: number
} => {
  token = token.replace("Bearer ", "");
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}


