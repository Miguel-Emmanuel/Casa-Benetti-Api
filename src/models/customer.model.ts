import {model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {TypeRegimenE} from '../enums';
import {Address} from './base/address.model';
import {BaseEntity} from './base/base-entity.model';

@model()
export class AdressClient extends Address {
    //Descripción
    @property({
        type: 'string',
    })
    otherCountryDescription?: string;
}
@model({
    settings: {
        postgresql: {
            table: 'catalog_Customer' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class Customer extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Direccion
    @property({
        type: 'object',
        jsonSchema: getJsonSchema(AdressClient)
    })
    address?: AdressClient;

    //Telefono
    @property({
        type: 'string',
        jsonSchema: {
            maxLength: 10,
            minLength: 10,
            errorMessage: {
                minLength: 'El teléfono debe contener 10 dígitos',
                maxLength: 'El teléfono debe contener 10 dígitos',
            },
        }
    })
    phone?: string;

    //Factura
    @property({
        type: 'boolean',
        default: false,
    })
    invoice?: boolean;

    //RFC
    @property({
        type: 'string',
    })
    rfc?: string;

    // Razón Social
    @property({
        type: 'string',
    })
    businessName?: string;

    // Regimen
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(TypeRegimenE)],
        },
    })
    regimen?: string;


    constructor(data?: Partial<Customer>) {
        super(data);
    }
}

export interface CustomerRelations {
    // describe navigational properties here
}

export type CustomerWithRelations = Customer & CustomerRelations;
