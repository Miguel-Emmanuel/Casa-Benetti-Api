import {Entity, model, property} from '@loopback/repository';

@model({
    settings: {
        postgresql: {
            table: 'catalog_TypesExpenses', // Nombre de la tabla en PostgreSQL,
        },
    }
})
export class TypesExpenses extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    @property({
        type: 'string',
    })
    expenseId?: string;

    @property({
        type: 'string',
        required: true,
    })
    classificationExpenses: string;

    @property({
        type: 'string',
        required: true,
    })
    concept: string;

    @property({
        type: 'string',
    })
    description?: string;


    constructor(data?: Partial<TypesExpenses>) {
        super(data);
    }
}

export interface TypesExpensesRelations {
    // describe navigational properties here
}

export type TypesExpensesWithRelations = TypesExpenses & TypesExpensesRelations;
