import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'internalExpenses_InternalExpenses', // Nombre de la tabla en PostgreSQL,
        },
    }
})
export class InternalExpenses extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;


    constructor(data?: Partial<InternalExpenses>) {
        super(data);
    }
}

export interface InternalExpensesRelations {
    // describe navigational properties here
}

export type InternalExpensesWithRelations = InternalExpenses & InternalExpensesRelations;
