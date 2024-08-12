import {hasMany, hasOne, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {ContainerStatus} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {DocumentSchema} from './base/document.model';
import {Collection, CollectionWithRelations} from './collection.model';
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
    })
    pedimento: string;

    //Número de contenedor
    @property({
        type: 'string',
    })
    containerNumber: string;

    //Número de factura
    @property({
        type: 'string',
    })
    invoiceNumber: string;

    //Peso bruto
    @property({
        type: 'string',
    })
    grossWeight: string;

    @hasMany(() => Document)
    documents: Document[];

    @hasOne(() => Collection)
    collection: CollectionWithRelations;

    //No. de cajas o bultos
    @property({
        type: 'number',
    })
    numberBoxes: number;

    //Medidas
    @property({
        type: 'string',
    })
    measures: string;

    //Fecha ETD
    @property({
        type: 'date',
    })
    ETDDate?: Date;

    //Fecha ETA
    @property({
        type: 'date',
    })
    ETADate?: Date;

    //Status
    @property({
        type: 'string',
        default: ContainerStatus.NUEVO
    })
    status: ContainerStatus;

    //Fecha de envio
    @property({
        type: 'date',
    })
    shippingDate?: Date;

    //Fecha estimada de llegada
    @property({
        type: 'date',
    })
    arrivalDate?: Date;

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
