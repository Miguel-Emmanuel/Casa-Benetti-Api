import {Entity, belongsTo, model, property} from '@loopback/repository';
import {TypeCommisionE} from '../enums';
import {Classification} from './classification.model';
import {QuotationDesigner} from './quotation-designer.model';
import {QuotationProjectManager} from './quotation-project-manager.model';
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
            fk_quotation_classificationId: {
                name: 'fk_quotation_classificationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'classificationid',
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
    id: number;

    //Relacion hacia cotizacion para el pm principal
    @belongsTo(() => Quotation)
    quotationId?: number;

    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    commissionPercentage: number;

    @belongsTo(() => Classification)
    classificationId: number;

    @belongsTo(() => QuotationDesigner)
    quotationDesignerId: number;

    //Relacion hacia pm secundarios
    @belongsTo(() => QuotationProjectManager)
    quotationProjectManagerId?: number;

    //Conocer si el pm es el principal o es secundario
    @property({
        type: 'string',
    })
    type: TypeCommisionE;

    constructor(data?: Partial<ClassificationPercentageMainpm>) {
        super(data);
    }
}

export interface ClassificationPercentageMainpmRelations {
    // describe navigational properties here
}

export type ClassificationPercentageMainpmWithRelations = ClassificationPercentageMainpm & ClassificationPercentageMainpmRelations;
