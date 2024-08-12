import {belongsTo, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {TypeRegimenE} from '../enums';
import {Address} from './base/address.model';
import {BaseEntity} from './base/base-entity.model';
import {Group, GroupWithRelations} from './group.model';
import {Organization} from './organization.model';
@model({
    settings: {
        postgresql: {
            table: 'catalog_Customer' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_organization_organizationId: {
                name: 'fk_organization_organizationId',
                entity: 'Organization',
                entityKey: 'id',
                foreignKey: 'organizationid',
            },
            fk_group_groupId: {
                name: 'fk_group_groupId',
                entity: 'Group',
                entityKey: 'id',
                foreignKey: 'groupid',
            },
        }
    }
})
export class Customer extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Nombre
    @property({
        type: 'string',
    })
    name: string;

    //Correo
    @property({
        type: 'string',
    })
    email: string;

    //Apellido paterno
    @property({
        type: 'string',
    })
    lastName: string;

    //Apellido materno
    @property({
        type: 'string',
    })
    secondLastName: string;

    //Direccion
    @property({
        type: 'object',
        jsonSchema: getJsonSchema(Address),
        required: false,
    })
    address?: Address;

    //Descripción
    @property({
        type: 'string',
        required: false,
    })
    addressDescription?: string;

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
    phone: string;

    //Factura
    @property({
        type: 'boolean',
    })
    invoice: boolean;

    //RFC
    @property({
        type: 'string',
    })
    rfc: string;

    // Razón Social
    @property({
        type: 'string',
    })
    businessName: string;

    // Regimen
    @property({
        type: 'string',
        jsonSchema: {
            enum: [...Object.values(TypeRegimenE)],
        },
    })
    regimen: string;

    @belongsTo(() => Organization)
    organizationId: number;

    @belongsTo(() => Group, {}, {jsonSchema: {nullable: true}})
    groupId: number;

    @property({
        type: 'boolean',
        default: true
    })
    isActive: boolean;

    @property({
        type: 'string',
    })
    activateDeactivateComment?: string;

    constructor(data?: Partial<Customer>) {
        super(data);
    }
}

export interface CustomerRelations {
    // describe navigational properties here
    group: GroupWithRelations
}

export type CustomerWithRelations = Customer & CustomerRelations;


export class CustomerGroup extends Customer {
    //Nombre del grupo
    @property({
        type: 'string',
        jsonSchema: {
            nullable: true
        }
    })
    groupName: string;

}
