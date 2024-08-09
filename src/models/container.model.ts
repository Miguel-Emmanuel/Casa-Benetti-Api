import {hasMany, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ContainerStatus} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {DocumentSchema} from './base/document.model';
import {Document} from './document.model';

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

    @hasMany(() => Document)
    documents: Document[];

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

    //Status
    @property({
        type: 'string',
        default: ContainerStatus.NUEVO
    })
    status: ContainerStatus;


    constructor(data?: Partial<Container>) {
        super(data);
    }
}

export interface ContainerRelations {
    // describe navigational properties here
}

export type ContainerWithRelations = Container & ContainerRelations;


export class ContainerCreate extends Container {
    @property({
        type: 'array',
        jsonSchema: {
            type: 'array',
            items: getJsonSchema(DocumentSchema)
        }
    })
    docs: DocumentSchema[];
}
