import {belongsTo, hasMany, model, property} from '@loopback/repository';
import {ProjectStatusE} from '../enums';
import {AdvancePaymentRecord} from './advance-payment-record.model';
import {BaseEntity} from './base/base-entity.model';
import {Quotation} from './quotation.model';

@model({
    settings: {
        postgresql: {
            table: 'project_Project' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_quotation_quotationId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
        }
    }
})
export class Project extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    @belongsTo(() => Quotation)
    quotationId: number;

    //Estatus del proyecto
    @property({
        type: 'string',
        required: false,
        default: ProjectStatusE.NUEVO
    })
    status: ProjectStatusE;

    @hasMany(() => AdvancePaymentRecord)
    advancePaymentRecords: AdvancePaymentRecord[];

    constructor(data?: Partial<Project>) {
        super(data);
    }
}

export interface ProjectRelations {
    // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
