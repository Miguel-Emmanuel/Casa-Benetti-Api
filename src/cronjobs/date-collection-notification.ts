import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import dayjs from 'dayjs';
import {SendgridServiceBindings} from '../keys';
import {PurchaseOrdersWithRelations} from '../models';
import {CollectionRepository, UserRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';

@cronJob()
export class DateCollectionNotificationCronJob extends CronJob {
    constructor(
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(CollectionRepository)
        public collectionRepository: CollectionRepository,
        @repository(UserRepository)
        public userRepository: UserRepository,
    ) {
        super({
            name: 'cron-job',
            onTick: async () => {
                await this.notify();
            },
            // cronTime: '*/5 * * * * *',
            cronTime: '0 0 * * *',
            start: true,
        });
    }

    async notify() {
        console.log('DateCollectionNotificationCronJob')
        const actualDay = dayjs().add(1, 'days');;
        const startDay = actualDay.startOf("day").toDate();
        const endDay = actualDay.endOf("day").toDate();
        const collections = await this.collectionRepository.find({
            where: {
                and: [
                    {
                        dateCollection: {
                            gte: startDay
                        }
                    },
                    {
                        dateCollection: {
                            lte: endDay
                        }
                    },
                ]
            },
            include: [
                {
                    relation: 'purchaseOrders',
                    scope: {
                        include: [
                            {
                                relation: 'proforma',
                                scope: {
                                    include: [
                                        {
                                            relation: 'provider'
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ],
        })
        const users = await this.userRepository.find({where: {isLogistics: true}})
        const emails = users.map(value => value.email);
        for (let index = 0; index < collections.length; index++) {
            const {id: collectionId, purchaseOrders} = collections[index];
            if (purchaseOrders) {
                const groupProformaId = this.groupByProformaId(purchaseOrders);
                for (let index = 0; index < groupProformaId?.length; index++) {
                    const element = groupProformaId[index];
                    const {proforma} = element[0]
                    if (proforma) {
                        const {provider} = proforma;
                        const options = {
                            to: emails,
                            templateId: SendgridTemplates.NOTIFICATION_DATE_COLLECTION.id,
                            dynamicTemplateData: {
                                subject: SendgridTemplates.NOTIFICATION_DATE_COLLECTION.subject,
                                providerName: `${provider?.name}`,
                                purchaseOrderId: element.map(value => value.id),
                                collectionId
                            }
                        };
                        await this.sendgridService.sendNotification(options);
                    }
                }
            }

        }

    }

    groupByProformaId = (array: PurchaseOrdersWithRelations[]): PurchaseOrdersWithRelations[][] => {
        const grouped: {[key: number]: any[]} = array.reduce((acc, item) => {
            if (!acc[item.proformaId]) {
                acc[item.proformaId] = [];
            }
            acc[item.proformaId].push(item);
            return acc;
        }, {} as {[key: number]: any[]});
        return Object.values(grouped);
    };

}
