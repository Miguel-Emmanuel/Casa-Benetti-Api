import {belongsTo, model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';
import {Brand} from './brand.model';
import {TypesExpenses} from './types-expenses.model';

@model({
    settings: {
        postgresql: {
            table: 'internalExpenses_InternalExpenses', // Nombre de la tabla en PostgreSQL,
        },
    }
})
export class InternalExpenses extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Clasificación del gasto
    @belongsTo(() => TypesExpenses)
    typesExpensesId: number;

    //Concepto del gasto
    @property({
        type: 'string',
        required: true,
    })
    concept: string;

    //Origen del gasto
    @property({
        type: 'string',
        required: true,
    })
    originExpense: string;

    //Referencia del proyecto
    @property({
        type: 'string',
    })
    projectReference: string;

    //Sucursal
    @belongsTo(() => Brand)
    brandId: number;

    //Importe
    @property({
        type: 'number',
        required: true,
    })
    amount: number;

    //Fecha de gasto
    @property({
        type: 'date',
        required: true,
    })
    expenditureDate: string;

    //Método de pago
    @property({
        type: 'date',
        required: true,
    })
    paymentMethod: string;

    //Proveedor
    @property({
        type: 'date',
    })
    provider: string;

    constructor(data?: Partial<InternalExpenses>) {
        super(data);
    }
}

export interface InternalExpensesRelations {
    // describe navigational properties here
}

export type InternalExpensesWithRelations = InternalExpenses & InternalExpensesRelations;
