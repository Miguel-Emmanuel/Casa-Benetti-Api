import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Branch} from '../models';
import {BranchRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class BranchService {
  constructor(
    @repository(BranchRepository)
    public branchRepository: BranchRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @inject(SecurityBindings.USER)
    private user: UserProfile,
  ) { }

  async create(branch: Branch) {
    try {
      console.log("CREATE", this.user.email);

      return this.branchRepository.create({...branch, organizationId: this.user.organizationId});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async find(filter?: Filter<Branch>) {
    try {
      return this.branchRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Branch>) {
    try {
      return this.branchRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Branch>) {
    try {
      return this.branchRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, branch: Branch,) {
    try {
      await this.branchRepository.updateById(id, branch);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
