import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Classification} from './classification.model';

@model({
    settings: {
        postgresql: {
            table: 'catalog_Line' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class Line extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'string',
        required: true,
    })
    name: string;

    @belongsTo(() => Classification)
    classificationId: number;

    constructor(data?: Partial<Line>) {
        super(data);
    }
}

export interface LineRelations {
    // describe navigational properties here
}

export type LineWithRelations = Line & LineRelations;
