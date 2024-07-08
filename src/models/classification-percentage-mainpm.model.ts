import {Entity, model, property} from '@loopback/repository';

//Porcentajes y clasifficationId por el MainPm de la cotizacion
@model()
export class ClassificationPercentageMainpm extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;


    constructor(data?: Partial<ClassificationPercentageMainpm>) {
        super(data);
    }
}

export interface ClassificationPercentageMainpmRelations {
    // describe navigational properties here
}

export type ClassificationPercentageMainpmWithRelations = ClassificationPercentageMainpm & ClassificationPercentageMainpmRelations;
