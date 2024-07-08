import {Entity, belongsTo, model, property} from '@loopback/repository';
import {Quotation} from './quotation.model';

//Porcentajes y clasifficationId por el MainPm de la cotizacion
@model({
    settings: {
        postgresql: {
            table: 'quotation_ClassificationPercentageMainpm' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_customer_customerId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
        }
    }
})
export class ClassificationPercentageMainpm extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @belongsTo(() => Quotation)
    quotationId: number;

    constructor(data?: Partial<ClassificationPercentageMainpm>) {
        super(data);
    }
}

export interface ClassificationPercentageMainpmRelations {
    // describe navigational properties here
}

export type ClassificationPercentageMainpmWithRelations = ClassificationPercentageMainpm & ClassificationPercentageMainpmRelations;
