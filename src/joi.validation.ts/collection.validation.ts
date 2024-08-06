import * as Joi from "joi";
import {CollectionDestinationE} from '../enums';


export const schemaPurchaseOrders = Joi.number().required()

export const schemaCollectionCreate = Joi.object({
    destination: Joi.string().valid(...Object.values(CollectionDestinationE)).messages({
        'any.only': `El destino debe ser igual a uno de los valores permitidos.`
    }).required(),
    dateCollection: Joi.date().required(),
    purchaseOrders: Joi.array().items(schemaPurchaseOrders).required(),
})
