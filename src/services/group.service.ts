import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Group} from '../models';
import {GroupRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class GroupService {
  constructor(
    @repository(GroupRepository)
    public groupRepository: GroupRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @inject(SecurityBindings.USER)
    private user: UserProfile,
  ) { }

  async create(group: Group) {
    try {
      return this.groupRepository.create({...group, /*organizationId: this.user.organizationId*/});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async find(filter?: Filter<Group>) {
    try {
      return this.groupRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Group>) {
    try {
      return this.groupRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Group>) {
    try {
      return this.groupRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, group: Group,) {
    try {
      await this.groupRepository.updateById(id, group);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
