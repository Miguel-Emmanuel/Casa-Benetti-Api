import {Entity, belongsTo, model, property} from '@loopback/repository';
import {User} from './user.model';

@model({
    settings: {
        postgresql: {
            table: 'quotation_QuotationProjectManager' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_quotation_quotationId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
            fk_user_userId: {
                name: 'fk_user_userId',
                entity: 'User',
                entityKey: 'id',
                foreignKey: 'userid',
            },
        }
    }
})
export class QuotationProjectManager extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt?: Date;

    @property({
        type: 'number',
    })
    quotationId?: number;

    @belongsTo(() => User)
    userId: number;

    //Comision del proyect manager
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentageProjectManager: number;

    constructor(data?: Partial<QuotationProjectManager>) {
        super(data);
    }
}

export interface QuotationProjectManagerRelations {
    // describe navigational properties here
}

export type QuotationProjectManagerWithRelations = QuotationProjectManager & QuotationProjectManagerRelations;
