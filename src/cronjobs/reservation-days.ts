import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import moment from "moment";
import {SendgridServiceBindings} from '../keys';
import {QuotationProductsRepository} from '../repositories';
import {SendgridService} from '../services';

@cronJob()
export class DuePaymentCronJob extends CronJob {
    constructor(
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(QuotationProductsRepository)
        public quotationProductsRepository: QuotationProductsRepository
    ) {
        super({
            name: 'cron-job',
            onTick: async () => {
                await this.notifyCustomer();
            },
            cronTime: '0 0 * * *',
            start: true,
        });
    }

    async notifyCustomer() {

        const lastDay = moment();
        const startDay = lastDay.startOf("day").format("YYYY-MM-DD HH:mm:ss.SSS Z");
        const endDay = lastDay.endOf("day").format("YYYY-MM-DD HH:mm:ss.SSS Z");

        const getPayments = await this.quotationProductsRepository.find({
            where: {
                or: [
                    {
                        isNotificationSent: false
                    },
                    {
                        isNotificationSent: {neq: undefined}
                    }
                ],
                and: [
                    {
                        dateReservationDays: {
                            gte: startDay
                        }
                    },
                    {
                        dateReservationDays: {
                            lte: endDay
                        }
                    },
                ]
            },
            include: [
                {
                    relation: ''
                }
            ]

        });

        let mailSent = 0;

        for (const duePayment of getPayments) {
            const clientEmail = duePayment?.contract?.client?.email;

            if (clientEmail) {
                const options = {
                    to: clientEmail,
                    dynamicTemplateData: {
                    }
                };

                await this.sendgridService.sendNotification(
                    options
                );

                await this.paymentRepository.updateById(duePayment?.id, {isNotificationSent: true});

                mailSent++;
            }

        }

        console.log(`Pago vencido correos enviados: ${mailSent}`);
    }

}
