import {Entity, hasMany, model, property} from '@loopback/repository';
import {QuotationProjectManager} from './quotation-project-manager.model';
import {User} from './user.model';

@model({
    settings: {
        postgresql: {
            table: 'quotation_Quotation' // Nombre de la tabla en PostgreSQL
        },
        // foreignKeys: {
        //     fk_organization_organizationId: {
        //         name: 'fk_organization_organizationId',
        //         entity: 'Organization',
        //         entityKey: 'id',
        //         foreignKey: 'organizationid',
        //     },
        // }
    }
})
export class Quotation extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Hay Arquitecto o despacho
    @property({
        type: 'boolean',
        required: true,
    })
    isArchitect: boolean;

    //Nombre del arquitecto
    @property({
        type: 'string',
        required: false,
    })
    architectName: string;

    //Comision del arquitecto
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentageArchitect: number;

    //Hay  cliente referenciado
    @property({
        type: 'boolean',
        required: true,
    })
    isreferencedClient: boolean;

    //Se requiere project manager
    @property({
        type: 'boolean',
        required: true,
    })
    isProjectManager: boolean;

    //Comision del cliente referenciado
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentagereferencedClient: number;

    @hasMany(() => User, {through: {model: () => QuotationProjectManager}})
    projectManagers: User[];

    //Se requiere proyectista
    @property({
        type: 'boolean',
        required: true,
    })
    isDesigner: boolean;



    constructor(data?: Partial<Quotation>) {
        super(data);
    }
}

export interface QuotationRelations {
    // describe navigational properties here
}

export type QuotationWithRelations = Quotation & QuotationRelations;
