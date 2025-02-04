import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import moment from 'moment';
import {PurchaseOrdersStatus} from '../enums';
import {SendgridServiceBindings} from '../keys';
import {DeliveryRequestRepository, PurchaseOrdersRepository} from '../repositories';
import {SendgridService} from '../services';

@cronJob()
export class ChangeStatusToCollection extends CronJob {
  constructor(
    @inject(SendgridServiceBindings.SENDGRID_SERVICE)
    public sendgridService: SendgridService,
    @repository(DeliveryRequestRepository)
    public deliveryRequestRepository: DeliveryRequestRepository,
    @repository(PurchaseOrdersRepository)
    public purchaseOrdersRepository: PurchaseOrdersRepository,
  ) {
    super({
      name: 'cron-job',
      onTick: async () => {
        await this.getPurchaseOrderToUpdate();
      },
      // cronTime: '*/5 * * * * *',
      cronTime: '0 0 * * *',
      start: true,
      timeZone: 'America/Mexico_City'
    });
  }

  async getPurchaseOrderToUpdate() {
    const currentDate = moment();
    const endDay = currentDate.endOf('day').toDate();

    const purchaseOrdersRealEndDate = await this.purchaseOrdersRepository.find({
      where: {
        productionRealEndDate: {
          lte: endDay,
        },
        status: PurchaseOrdersStatus.EN_PRODUCCION
      },
      include: [
        {
          relation: "accountPayable",
        }
      ]
    });

    const purchaseOrdersEndDate = await this.purchaseOrdersRepository.find({
      where: {
        productionEndDate: {
          lte: endDay,
        },
        productionRealEndDate: undefined,
        status: PurchaseOrdersStatus.EN_PRODUCCION
      },
      include: [
        {
          relation: "accountPayable",
        }
      ]
    });

    const purchaseOrders = purchaseOrdersRealEndDate.concat(purchaseOrdersEndDate)

    let purchaseOrderUpdatedCount = 0;

    for (const purchaseOrder of purchaseOrders) {
      const {accountPayable} = purchaseOrder;

      if (accountPayable.totalPaid >= accountPayable.total) {
        await this.purchaseOrdersRepository.updateById(purchaseOrder.id, {
          status: PurchaseOrdersStatus.EN_RECOLECCION
        })
        purchaseOrderUpdatedCount++
      }

    }

    console.log("purchaseOrderUpdatedCount: ", purchaseOrderUpdatedCount)
  }

}
