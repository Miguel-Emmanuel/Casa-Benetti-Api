import {model, property} from '@loopback/repository';
import {BaseEntity} from './base/base-entity.model';

@model({
    settings: {
        postgresql: {
            table: 'container_Container' // Nombre de la tabla en PostgreSQL
        },
    }
})
export class Container extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Pedimiento
    @property({
        type: 'string',
        required: true,
    })
    pedimento: string;

    //Número de contenedor
    @property({
        type: 'string',
        required: true,
    })
    containerNumber: string;

    //Número de factura
    @property({
        type: 'string',
        required: true,
    })
    invoiceNumber: string;

    //Peso bruto
    @property({
        type: 'string',
        required: true,
    })
    grossWeight: string;

    //No. de cajas o bultos
    @property({
        type: 'number',
        required: true,
    })
    numberBoxes: number;

    //Medidas
    @property({
        type: 'string',
        required: true,
    })
    measures: string;

    //Fecha ETD
    @property({
        type: 'date',
        required: true,
    })
    ETDDate: string;

    //Fecha ETA
    @property({
        type: 'date',
        required: true,
    })
    ETADate: string;


    constructor(data?: Partial<Container>) {
        super(data);
    }
}

export interface ContainerRelations {
    // describe navigational properties here
}

export type ContainerWithRelations = Container & ContainerRelations;
