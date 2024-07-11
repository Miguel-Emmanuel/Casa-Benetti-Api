import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, InclusionFilter, Where, repository} from '@loopback/repository';
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
    const include: InclusionFilter[] = [
      {
        relation: 'brand',
        scope: {
          fields: ['brandName']
        }
      },
      {
        relation: 'document',
        scope: {
          fields: ['fileURL', 'name', 'extension', 'id']
        }
      },

    ]
    if (filter?.include)
      filter.include = [
        ...filter.include,
        ...include
      ]
    else
      filter = {
        ...filter, include: [
          ...include
        ]
      };
    try {
      return (await this.proformaRepository.find(filter)).map(value => {
        const {id, proformaId, brand, proformaDate, proformaAmount, currency, document} = value;
        return {
          id,
          proformaId,
          brandName: brand?.brandName,
          proformaDate,
          proformaAmount,
          currency,
          document
        }
      });
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
