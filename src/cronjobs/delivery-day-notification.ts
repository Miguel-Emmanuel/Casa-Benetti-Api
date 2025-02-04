import {CronJob, cronJob} from '@loopback/cron';
import {repository} from '@loopback/repository';

import {inject} from '@loopback/core';
import dayjs from 'dayjs';
import {SendgridServiceBindings} from '../keys';
import {PurchaseOrders, PurchaseOrdersRelations, QuotationProducts, QuotationProductsWithRelations} from '../models';
import {DeliveryRequestRepository, UserRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';

@cronJob()
export class DeliveryDayNotificationCronJob extends CronJob {
    constructor(
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(DeliveryRequestRepository)
        public deliveryRequestRepository: DeliveryRequestRepository,
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
        console.log('DeliveryDayNotificationCronJob')
        const actualDay = dayjs().add(1, 'days');;
        const startDay = actualDay.startOf("day").toDate();
        const endDay = actualDay.endOf("day").toDate();
        console.log('startDay: ', startDay)
        console.log('endDay: ', endDay)

        const deliveryRequest = await this.deliveryRequestRepository.find({
            where: {
                and: [
                    {
                        deliveryDay: {
                            gte: startDay
                        }
                    },
                    {
                        deliveryDay: {
                            lte: endDay
                        }
                    },
                ]
            },
            include: [
                {
                    relation: 'project',
                    scope: {
                        include: [
                            {
                                relation: 'customer'
                            }
                        ]
                    }
                },
                {
                    relation: 'purchaseOrders',
                    scope: {
                        include: [
                            {
                                relation: 'proforma',
                                scope: {
                                    include: [
                                        {
                                            relation: 'quotationProducts',
                                            scope: {
                                                include: [
                                                    {
                                                        relation: 'product',
                                                        scope: {
                                                            include: [
                                                                {
                                                                    relation: 'document'
                                                                },
                                                                {
                                                                    relation: 'line'
                                                                }
                                                            ]
                                                        }
                                                    }
                                                ],
                                            }
                                        },
                                    ]
                                }
                            }
                        ]
                    }
                }
            ],
        })
        const users = await this.userRepository.find({where: {isNationalLogistics: true}})
        const emails = users.map(value => value.email);
        for (let index = 0; index < deliveryRequest.length; index++) {
            const {purchaseOrders, project, id} = deliveryRequest[index];
            if (purchaseOrders) {
                for (let index = 0; index < emails.length; index++) {
                    const elementMail = emails[index];
                    const options = {
                        to: elementMail,
                        templateId: SendgridTemplates.NOTIFICATION_DELIVERY_DAY.id,
                        dynamicTemplateData: {
                            subject: SendgridTemplates.NOTIFICATION_DELIVERY_DAY.subject,
                            deliveryRequestId: id,
                            projectId: project?.projectId,
                            purchaseOrders: purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                                const {id: purchaseOrderid, proforma, productionEndDate} = value;
                                const {quotationProducts} = proforma;
                                return {
                                    id: purchaseOrderid,
                                    products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                                        const {id: productId, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, } = value;
                                        const {document, line, name} = product;
                                        const descriptionParts = [
                                            line?.name,
                                            name,
                                            mainMaterial,
                                            mainFinish,
                                            secondaryMaterial,
                                            secondaryFinishing
                                        ];
                                        const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                                        return {
                                            id: productId,
                                            image: document?.fileURL,
                                            description,
                                        }
                                    })
                                }
                            }),
                        }
                    };
                    await this.sendgridService.sendNotification(options);
                }
                //Email del cliente
                const {customer} = project
                const options2 = {
                    to: customer?.email,
                    templateId: SendgridTemplates.NOTIFICATION_DELIVERY_DAY_CUSTOMER.id,
                    dynamicTemplateData: {
                        subject: SendgridTemplates.NOTIFICATION_DELIVERY_DAY_CUSTOMER.subject,
                        projectId: project?.projectId,
                        purchaseOrders: purchaseOrders?.map((value: PurchaseOrders & PurchaseOrdersRelations) => {
                            const {id: purchaseOrderid, proforma, productionEndDate} = value;
                            const {quotationProducts} = proforma;
                            return {
                                id: purchaseOrderid,
                                products: quotationProducts?.map((value: QuotationProducts & QuotationProductsWithRelations) => {
                                    const {id: productId, product, mainMaterial, mainFinish, secondaryMaterial, secondaryFinishing, } = value;
                                    const {document, line, name} = product;
                                    const descriptionParts = [
                                        line?.name,
                                        name,
                                        mainMaterial,
                                        mainFinish,
                                        secondaryMaterial,
                                        secondaryFinishing
                                    ];
                                    const description = descriptionParts.filter(part => part !== null && part !== undefined && part !== '').join(' ');
                                    return {
                                        id: productId,
                                        image: document?.fileURL,
                                        description,
                                    }
                                })
                            }
                        }),
                    }
                };
                await this.sendgridService.sendNotification(options2);
            }

        }

    }
}
