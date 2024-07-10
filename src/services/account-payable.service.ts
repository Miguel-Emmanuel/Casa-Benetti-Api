import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {AccountPayable} from '../models';
import {AccountPayableRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class AccountPayableService {
  constructor(
    @repository(AccountPayableRepository)
    public accountPayableRepository: AccountPayableRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
  ) { }

  async create(accountPayable: AccountPayable) {
    try {
      return this.accountPayableRepository.create({...accountPayable, });
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
  async find(filter?: Filter<AccountPayable>) {
    try {
      const findAccountPayable = await this.accountPayableRepository.find({
        include: [
          {relation: "project"},
          {relation: "quotation"},
          {relation: "customer"}
        ]
      })

      const arrayValues = findAccountPayable?.map((item: any) => {
        return {
          idProject: item.projectId,
          clientName: `${item?.customer?.name} ${item?.customer?.lastName} ${item?.customer?.secondLastName}`,
          closingDate: item?.quotation?.closingDate,
        }
      })
      return arrayValues;
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<AccountPayable>) {
    try {
      const findAccountPayable: any = await this.accountPayableRepository.findById(id, {
        include: [
          {relation: "project"},
          {
            relation: "quotation",
            scope: {
              include: [{relation: "showroomManager"}]
            }
          },
          {relation: "customer"},
          {
            relation: "purchaseOrders",
            scope: {
              include: [{relation: "provider"}]
            }
          },
          {
            relation: "accountPayableHistories",
            scope: {
              include: [{relation: "provider"}]
            }
          },
        ]
      })
      const purchaseOrders = findAccountPayable?.purchaseOrders?.map((item: any) => {
        return {
          id: item.id,
          provider: item?.provider?.name,
          quantity: item?.quantity,
          total: item?.total,
          status: item?.status,
        }
      })
      const accountPayableHistories = findAccountPayable?.accountPayableHistories?.map((item: any) => {
        return {
          id: item?.id,
          proformaDate: item?.proformaDate,
          proformaNumber: item?.proformaNumber,
          currency: item?.currency,
          proformaAmount: item?.proformaAmount,
          paymentDate: item?.paymentDate,
          advancePaymentAmount: item?.advancePaymentAmount,
          balance: item?.balance,
          status: item?.status,
          provider: item?.provider?.name,
        }
      })
      const values: any = {
        idProject: findAccountPayable.projectId,
        clientName: `${findAccountPayable?.customer?.name} ${findAccountPayable?.customer?.lastName} ${findAccountPayable?.customer?.secondLastName}`,
        closingDate: findAccountPayable?.quotation?.closingDate,
        showroomManager: `${findAccountPayable?.showroomManager?.firstName} ${findAccountPayable?.showroomManager?.lastName}`,
        total: findAccountPayable.total,
        purchaseOrders,
        accountPayableHistories
      }
      return values;
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<AccountPayable>) {
    try {
      return this.accountPayableRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, brand: AccountPayable,) {
    try {
      await this.accountPayableRepository.updateById(id, brand);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }
}
