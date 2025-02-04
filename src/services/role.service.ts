import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, FilterExcludingWhere, repository} from '@loopback/repository';
import {ResponseServiceBindings, UserServiceBindings} from '../keys';
import {Role, RoleModule} from '../models';
import {OrganizationRepository, RoleModuleRepository, RoleRepository, UserDataRepository, UserRepository} from '../repositories';
import {ResponseService} from './response.service';
import {MyUserService} from './user.service';

@injectable({scope: BindingScope.TRANSIENT})
export class RoleService {
  constructor(
    @repository(RoleRepository)
    public roleRepository: RoleRepository,
    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @repository(OrganizationRepository)
    public organizationRepository: OrganizationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(RoleModuleRepository)
    public roleModuleRepository: RoleModuleRepository,
    @repository(UserDataRepository)
    public userDataRepository: UserDataRepository,
  ) { }

  async create(userRole: any, token: string) {
    const {organizationId} = this.userService.getTokenData(token);
    const orgValidator = await this.organizationRepository.findById(organizationId, {include: ['roles']});
    if (!orgValidator || !orgValidator.isActive) {
      return this.responseService.badRequest('¡Oh, no! La organización no es válida o está desactivada, revisa por favor e intenta de nuevo.');
    }

    const {roleModules} = userRole;
    delete userRole.roleModules;

    const roleNamesDb = orgValidator.roles ? orgValidator?.roles.map(u => (u.name)) : [''];
    if (roleNamesDb.includes(userRole.name))
      return this.responseService.badRequest(`¡Oh, no! Ya existe un rol con el nombre: ${userRole.name} en la organización, intenta con otro nombre.`);

    const savedRole = await this.roleRepository.create({...userRole, organizationId});
    for (const roleModule of roleModules) {
      const savedRoleModule = await this.roleModuleRepository.create({...roleModule, roleId: savedRole.id, moduleId: roleModule.moduleId});
    }

    const roleModuleResponse = await this.roleModuleRepository.find({where: {roleId: savedRole.id}});

    return {...savedRole, roleModules: roleModuleResponse};

  }

  async deactivateById(id: number, body: {activateDeactivateComment: string}, token: string) {
    if (!body.activateDeactivateComment) {
      return this.responseService.badRequest(`El comentario de activación/desactivación es requerido`);
    }

    const oldData = await this.roleRepository.findById(id, {
      include: [{
        relation: 'users'
      }]
    });

    if (oldData.isActive && oldData.users) {
      return this.responseService.badRequest(`¡Oh, no! Se ha detectado que no es posible desactivar el rol debido que se encuentra asignado a usuarios, por favor revisa y vuelve a intentarlo.`);
    }
    await this.roleRepository.updateById(id, {isActive: !oldData.isActive, activateDeactivateComment: body.activateDeactivateComment});
    return this.responseService.ok({message: 'Success'})
  }

  async find(token: string, filter?: Filter<Role>) {
    const tokenData = this.userService.getTokenData(token);
    if (filter?.where) {
      filter.where = {...filter.where, organizationId: tokenData.organizationId, isDeleted: false}
    } else {
      filter = {...filter, where: {organizationId: tokenData.organizationId, isDeleted: false}};
    }

    return Promise.all((await this.roleRepository.find(filter)).map(async (b: any) => {
      const createdBy = await this.userRepository.findByIdOrDefault(b.createdBy);
      const updatedBy = await this.userRepository.findByIdOrDefault(b.updatedBy);
      const assignedUsers = await this.userRepository.count({roleId: b.id});
      b.createdBy = {id: createdBy?.id, avatar: createdBy?.avatar, name: createdBy && `${createdBy?.firstName} ${createdBy?.lastName}`};
      b.updatedBy = {id: updatedBy?.id, avatar: updatedBy?.avatar, name: updatedBy && `${updatedBy?.firstName} ${updatedBy?.lastName}`};
      return {
        ...b,
        assignedUsers: assignedUsers.count
      }
    }));
  }

  async deleteById(id: number) {
    const role = await this.roleRepository.findOne({where: {id}});
    if (!role)
      throw this.responseService.notFound('Rol no encontrado')
    const user = await this.userRepository.findOne({where: {roleId: id}})
    if (user)
      throw this.responseService.badRequest('El user rol no puede ser eliminado ya que tiene usuarios relacionados, consulte a su administrador.')
    await this.roleRepository.updateById(id, {isDeleted: true});
    this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'})
  }

  async findById(id: number, token: string, filter?: FilterExcludingWhere<Role>) {
    const tokenData = this.userService.getTokenData(token);
    const result = await this.roleRepository.findOne({where: {id, isDeleted: false}, ...filter});
    if (result?.organizationId != tokenData.organizationId) {
      return this.responseService.forbbiden('El elemento que estas buscando no pertenece a tu organización');
    }

    const roleModules = await this.roleModuleRepository.find({
      where: {roleId: id},
      include: [{relation: 'module'}],
    })

    const roleModuleTransform = roleModules.map((value: any) => {
      return {
        id: value.id,
        createdAt: value.createdAt,
        create: value.create,
        read: value.read,
        update: value.update,
        del: value.del,
        moduleId: value.moduleId,
        roleId: value.roleId,
        module: value?.module,
      }
    })
    const groupList = roleModuleTransform.reduce((previousValue: any, currentValue: any) => {
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
    return {...result, roleModules: newList}
  }
  async updateById(id: number, token: string, role: (Role & {roleModules?: RoleModule[]})) {
    const oldData = await this.roleRepository.findById(id);
    const organization = await this.organizationRepository.findById(oldData.organizationId, {include: ['roles']});

    const {roleModules} = role;
    delete role.roleModules;

    if (role.name != oldData.name) {
      const roleNamesDb = organization?.roles ? organization?.roles.map(u => (u.name)) : [''];
      if (roleNamesDb?.includes(role.name))
        return this.responseService.badRequest(`¡Oh, no! Ya existe un rol con el nombre: ${role.name} en la organización, intenta con otro nombre.`);
    }

    await this.roleRepository.updateById(id, role);

    const oldRoleModules = await this.roleModuleRepository.find({where: {roleId: id}, fields: ['id']});
    const roleModulesIds = roleModules?.map((r: any) => r.id && (r.id));
    for (const roleModule of oldRoleModules) {
      if (!roleModulesIds?.includes(roleModule.id))
        this.roleModuleRepository.deleteById(roleModule.id);
    }

    if (roleModules)
      for (const roleModule of roleModules) {
        if (roleModule.id) {
          await this.roleModuleRepository.updateById(roleModule.id, roleModule);
        } else {
          await this.roleModuleRepository.create({...roleModule, roleId: id});
        }
      }

    return this.responseService.ok({message: 'Success'});
  }

  async getRoleModule(id: typeof Role.prototype.id, token: string) {
    const tokenData = this.userService.getTokenData(token);
    const result = await this.roleRepository.findOne({where: {id, isDeleted: false}});
    if (!result)
      return this.responseService.notFound('User role no encontrado.');

    if (result?.organizationId != tokenData.organizationId) {
      return this.responseService.forbbiden('El elemento que estas buscando no pertenece a tu organización');
    }
    const roleModule = await this.roleModuleRepository.find({where: {roleId: id}})
    return roleModule;
  }
}
