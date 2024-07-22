import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import dayjs from 'dayjs';
import {SendgridServiceBindings} from '../keys';
import {QuotationProductsRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';

@cronJob()
export class ResertvationDayCronJob extends CronJob {
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
            // cronTime: '*/5 * * * * *',
            cronTime: '0 0 * * *',
            start: true,
        });
    }

    async notifyCustomer() {
        const lastDay = dayjs();
        const startDay = lastDay.startOf("day").toDate();
        const endDay = lastDay.endOf("day").toDate();
        const quotationProducts = await this.quotationProductsRepository.find({
            where: {
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
                    {
                        or: [
                            {
                                isNotificationSent: false
                            },
                            {
                                isNotificationSent: {eq: null}
                            }
                        ]
                    }
                ]
            },
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        fields: ['id', 'customerId'],
                        include: [
                            {
                                relation: 'customer',
                                scope: {
                                    fields: ['id', 'name', 'lastName', 'secondLastName']
                                }
                            }
                        ]
                    }
                },
                {
                    relation: 'product',
                    scope: {
                        fields: ['id', 'name'],

                    }
                }
            ],
            fields: ['id', 'quotationId', 'reservationDays', 'dateReservationDays', 'productId']

        });
        for (const quotationProduct of quotationProducts) {
            const {quotation, product, dateReservationDays} = quotationProduct;
            const {customer} = quotation;
            const email = customer?.name;
            const options = {
                to: 'waldo@whathecode.com',
                templateId: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.id,
                dynamicTemplateData: {
                    subject: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.subject,
                    customerName: `${customer?.name} ${customer?.lastName ?? ''} ${customer?.secondLastName ?? ''}`,
                    productName: `${product?.name}`,
                    dateReservationDays: dayjs(dateReservationDays).format('DD/MM/YYYY')
                }
            };
            await this.sendgridService.sendNotification(options);
            await this.quotationProductsRepository.updateById(quotationProduct?.id, {isNotificationSent: true});

        }
        const options = {
            to: 'waldo@whathecode.com',
            templateId: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.id,
            dynamicTemplateData: {
                subject: SendgridTemplates.NOTIFICATION_RESERVATION_DAY.subject,
                productName: `TEST PARA SABER LA HORA ${dayjs().format('DD/MM/YYYY')}`,
            }
        };
        await this.sendgridService.sendNotification(options);

    }

}
