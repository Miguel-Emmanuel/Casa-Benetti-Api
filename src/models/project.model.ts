import {belongsTo, model, property} from '@loopback/repository';
import {ProjectStatusE} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {Quotation} from './quotation.model';

@model()
export class Project extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @belongsTo(() => Quotation)
    quotationId: number;

    //Estatus del proyecto
    @property({
        type: 'string',
        required: false,
        default: ProjectStatusE.NUEVO
    })
    status: ProjectStatusE;

    constructor(data?: Partial<Project>) {
        super(data);
    }
}

export interface ProjectRelations {
    // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
