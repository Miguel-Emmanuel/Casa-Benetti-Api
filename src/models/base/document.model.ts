import {Entity, model, property} from '@loopback/repository';

@model()
export class DocumentSchema extends Entity {
    @property({
        type: 'string',
    })
    fileURL: string;

    @property({
        type: 'string',
    })
    name: string;

    @property({
        type: 'string',
    })
    extension: string;
}
