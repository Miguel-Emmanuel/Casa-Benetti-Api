import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  AccountPayable,
  Proforma,
} from '../models';
import {AccountPayableRepository} from '../repositories';

export class AccountPayableProformaController {
  constructor(
    @repository(AccountPayableRepository)
    public accountPayableRepository: AccountPayableRepository,
  ) { }

  @get('/account-payables/{id}/proforma', {
    responses: {
      '200': {
        description: 'Proforma belonging to AccountPayable',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Proforma),
          },
        },
      },
    },
  })
  async getProforma(
    @param.path.number('id') id: typeof AccountPayable.prototype.id,
  ): Promise<Proforma> {
    return this.accountPayableRepository.proforma(id);
  }
}
