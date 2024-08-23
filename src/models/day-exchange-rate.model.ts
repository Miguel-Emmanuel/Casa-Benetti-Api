import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'dayExchangeRate_DayExchangeRate' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class DayExchangeRate extends Entity {
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
    euroToPeso: number;

    @property({
        type: 'number',
    })
    euroToDolar: number;

    @property({
        type: 'number',
    })
    dolarToPeso: number;

    @property({
        type: 'number',
    })
    dolarToEuro: number;

    // Define well-known properties here

    // Indexer property to allow additional data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [prop: string]: any;

    constructor(data?: Partial<DayExchangeRate>) {
        super(data);
    }
}

export interface DayExchangeRateRelations {
    // describe navigational properties here
}

export type DayExchangeRateWithRelations = DayExchangeRate & DayExchangeRateRelations;
