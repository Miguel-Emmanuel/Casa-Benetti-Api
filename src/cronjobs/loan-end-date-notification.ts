import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import dayjs from 'dayjs';
import {SendgridServiceBindings} from '../keys';
import {QuotationProductsStockRepository, UserRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';

@cronJob()
export class LoanEndDateNotificationCronJob extends CronJob {
    constructor(
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(QuotationProductsStockRepository)
        public quotationProductsStockRepository: QuotationProductsStockRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) {
        super({
            name: 'cron-job',
            onTick: async () => {
                await this.notify();
            },
            // cronTime: '*/5 * * * * *',
            cronTime: '0 7 * * *',
            start: true,
            timeZone: 'America/Mexico_City'
        });
    }

    async notify() {
        console.log('LoanEndDateNotificationCronJob')
        const actualDay = dayjs().add(3, 'days');;
        const startDay = actualDay.startOf("day").toDate();
        const endDay = actualDay.endOf("day").toDate();
        console.log('startDay: ', startDay)
        console.log('endDay: ', endDay)

        const quotationProducts = await this.quotationProductsStockRepository.find({
            where: {
                and: [
                    {
                        loanEndDate: {
                            gte: startDay
                        }
                    },
                    {
                        loanEndDate: {
                            lte: endDay
                        }
                    },
                ]
            },
            include: [
                {
                    relation: 'quotation',
                    scope: {
                        include: [
                            {
                                relation: 'mainProjectManager'
                            },
                            {
                                relation: 'project'
                            },
                            {
                                relation: 'customer'
                            }
                        ]
                    }
                },

            ],
        })
        for (let index = 0; index < quotationProducts.length; index++) {
            const {quotation: {mainProjectManager, project, customer}} = quotationProducts[index];
            const options = {
                to: mainProjectManager?.email,
                templateId: SendgridTemplates.NOTIFICATION__LOAN_END_DATE.id,
                dynamicTemplateData: {
                    subject: SendgridTemplates.NOTIFICATION__LOAN_END_DATE.subject,
                    projectId: project?.projectId,
                    customerName: customer ? `${customer?.name} ${customer?.lastName ?? ''}` : ''
                }
            };
            await this.sendgridService.sendNotification(options);
        }

    }
}
