import {UserRepository} from '@loopback/authentication-jwt';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SendgridServiceBindings} from '../keys';
import {ProformaRepository} from '../repositories';
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
    ) { }
    async afterSave(_this: any, ctx: any) {
        console.log(ctx)
        const {isNewInstance, instance, data, where} = ctx;
        if (isNewInstance === true) {
            await this.notifyLogistics(instance);
        } else {

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
}
