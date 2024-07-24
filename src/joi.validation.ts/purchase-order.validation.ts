import * as Joi from "joi";
import {PurchaseOrdersStatus} from '../enums';


export const schameUpdateStatusPurchase = Joi.object({
    status: Joi.string().valid(...Object.values(PurchaseOrdersStatus)).messages({
        'any.only': `El estatus debe ser igual a uno de los valores permitidos.`
    }),
})
