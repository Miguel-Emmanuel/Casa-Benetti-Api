import {BindingScope, Getter, inject, injectable} from '@loopback/core';
import {Request, RestBindings} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {LogModelName} from '../enums';
//import {ModelLogsServiceBindings} from '../keys';
//import {ModelLogsService} from '../services/model-logs.service';

@injectable({scope: BindingScope.TRANSIENT})
export class OperationHook {
    constructor(
        @inject.getter(SecurityBindings.USER, {optional: true})
        private getCurrentUser: Getter<UserProfile>,
        //@inject.getter(ModelLogsServiceBindings.MODEL_LOGS_SERVICE)
        //public logService: Getter<ModelLogsService>,
        @inject(RestBindings.Http.REQUEST, {optional: true})
        private req: Request,
    ) { }
    async beforeSave(_this: any, ctx: any, modelName: LogModelName) {
        const currentUser = await this.getCurrentUser();
        //const logService = await this.logService();
        //const token = this.req?.headers?.authorization || undefined;
        const {isNewInstance, instance, data, where} = ctx;
        if (isNewInstance) {
            instance.updatedBy = currentUser?.id ? parseInt(currentUser?.id) : undefined;
            instance.createdBy = currentUser?.id ? parseInt(currentUser?.id) : undefined;
            // if (token && !token.includes('undefined')) {
            //     const instanceString = JSON.stringify(instance)
            //     const instanceObject = JSON.parse(instanceString)
            //    await logService.createLog({token, modificationType: LogModificationType.CREATE, modelName}, null, instanceObject);
            // }
        } else {
            data.updatedBy = currentUser?.id ? parseInt(currentUser?.id) : undefined;
            data.updatedAt = new Date();
            // if (token && !token.includes('undefined')) {
            //     const keys = Object.keys(ctx.data)
            //     const oldData = await _this.findOne({where: {id: where.id}, fields: keys});
            //     let modificationType = LogModificationType.UPDATE
            //     if (keys.includes('isActive')) {
            //         const isActive = ctx.data.isActive;
            //         modificationType = isActive ? LogModificationType.ACTIVATE : LogModificationType.DEACTIVATE
            //     }
            //     await logService.createLog({token, modificationType, modelName}, oldData, data);
            // }
        }
    }
}
