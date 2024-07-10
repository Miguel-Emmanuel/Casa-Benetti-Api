import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {Proforma} from '../models';
import {ProformaRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProformaService {
  constructor(
    @repository(ProformaRepository)
    public proformaRepository: ProformaRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
  ) { }

  async create(proforma: Proforma) {
    try {
      const newProforma = await this.proformaRepository.create({...proforma});
      this.proformaRepository.document(newProforma.id).create({
        fileURL: "",
        name: "",
        extension: ""
      })
      return newProforma
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async find(filter?: Filter<Proforma>) {
    try {
      return this.proformaRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Proforma>) {
    try {
      return this.proformaRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Proforma>) {
    try {
      return this.proformaRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, proforma: Proforma,) {
    try {
      await this.proformaRepository.updateById(id, proforma);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
