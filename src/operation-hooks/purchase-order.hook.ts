import {UserRepository} from '@loopback/authentication-jwt';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {TypeUserE} from '../enums';
import {SendgridServiceBindings} from '../keys';
import {ProformaRepository, ProjectRepository} from '../repositories';
import {SendgridService, SendgridTemplates} from '../services';
//import {ModelLogsServiceBindings} from '../keys';
//import {ModelLogsService} from '../services/model-logs.service';

@injectable({scope: BindingScope.TRANSIENT})
export class PurchaseOrderHook {
    constructor(
        @repository(UserRepository)
        public userRepository: UserRepository,
        @inject(SendgridServiceBindings.SENDGRID_SERVICE)
        public sendgridService: SendgridService,
        @repository(ProformaRepository)
        public proformaRepository: ProformaRepository,
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
    ) { }
    async afterSave(_this: any, ctx: any) {
        console.log('AFTER SAVE')
        const {isNewInstance, instance, data, where} = ctx;
        if (isNewInstance === true) {
            await this.notifyLogistics(instance);
        }
    }
    async beforeSave(_this: any, ctx: any) {
        console.log('BEFORE SAVE')
        const {isNewInstance, instance, data, where} = ctx;
        if (!isNewInstance) {
            if (data?.status && where?.id) {
                console.log('instance: ', instance)
                console.log('data: ', data)
                console.log('where: ', where)
                const order = await ctx.Model.findOne({where: {id: where.id}})
                if (order) {
                    const order = await ctx.Model.findOne({where: {id: where.id}})
                    const project = await this.projectRepository.findOne({
                        where: {id: order?.projectId},
                        include: [
                            {
                                relation: 'quotation',
                                scope: {
                                    include: [
                                        {
                                            relation: 'mainProjectManager'
                                        },
                                        {
                                            relation: 'projectManagers'
                                        }
                                    ]
                                }
                            },
                            {
                                relation: 'customer'
                            }
                        ]
                    })
                    if (project) {
                        const users = await this.userRepository.find({where: {typeUser: TypeUserE.ADMINISTRADOR}})
                        const emailsAdmins = users.map(value => value.email);
                        const mainProjectManager = project?.quotation?.mainProjectManager?.email;
                        const emails = project?.quotation?.projectManagers?.map((value: any) => value.email) ?? [];
                        emails.push(mainProjectManager);
                        emails.push(...emailsAdmins);
                        const customerName = project?.customer?.name;
                        await this.notifyChangeStatus(project.projectId, order.id, order.status, data?.status, customerName, emails);
                    }
                }
            }
        }
    }

    async notifyLogistics(instance: any) {
        try {
            const {id, projectId} = instance
            const users = await this.userRepository.find({where: {isPurchaseOrderManager: true}})
            const emails = users.map(value => value.email);
            if (emails.length > 0) {
                const options = {
                    to: emails,
                    templateId: SendgridTemplates.NEW_PURCHASE_ORDER.id,
                    dynamicTemplateData: {
                        subject: SendgridTemplates.NEW_PURCHASE_ORDER.subject,
                        projectId: projectId,
                        orderId: id
                    }
                };
                await this.sendgridService.sendNotification(options);
            }
        } catch (error) {
            console.log('Error al mandar correo para nueva orden de compra.', error)
        }
    }
    async notifyChangeStatus(projectId: string, purchaseOrderId: number, statusold: string, statusnew: string, customerName: string, emails: any[]) {
        try {

            if (emails.length > 0) {
                const options = {
                    to: emails,
                    templateId: SendgridTemplates.NOTIFICATION_PROJECT_UPDATED.id,
                    dynamicTemplateData: {
                        subject: SendgridTemplates.NOTIFICATION_PROJECT_UPDATED.subject,
                        projectId: projectId,
                        purchaseOrderId,
                        statusold,
                        statusnew,
                        customerName
                    }
                };
                await this.sendgridService.sendNotification(options);
            }
        } catch (error) {
            console.log('Error al mandar correo para nueva orden de compra.', error)
        }
    }
}
