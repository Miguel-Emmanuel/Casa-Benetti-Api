import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
    del,
    param,
    response
} from '@loopback/rest';
import {DocumentsService} from '../services';

@authenticate('jwt')
export class DocumentsController {
    constructor(
        @service()
        public documentsService: DocumentsService
    ) { }

    @del('/documents/{id}')
    @response(201, {
        description: 'customer model instance',
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    properties: {
                        message: {type: 'string', example: 'En hora buena! La acción se ha realizado con éxito'}
                    }
                }
            },
        },
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
        await this.documentsService.deleteById(id);
    }
}
