import {hasMany, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Line} from './line.model';

@model({
    settings: {
        postgresql: {
            table: 'catalog_Classification' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class Classification extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'string',
    })
    name: string;

    @hasMany(() => Line)
    lines: Line[];

    //Porcentaje del limite del project manager
    @property({
        type: 'number',
    })
    projectManagerPercentage: number;

    //Porcentaje del limite del proyectista
    @property({
        type: 'number',
    })
    designerPercentage: number;

    //check comission pm
    @property({
        type: 'boolean',
    })
    isCommissionPM: boolean;

    //check comission proyectista
    @property({
        type: 'boolean',
    })
    isCommissionDesigner: boolean;

    constructor(data?: Partial<Classification>) {
        super(data);
    }
}

export interface ClassificationRelations {
    // describe navigational properties here
}

export type ClassificationWithRelations = Classification & ClassificationRelations;
