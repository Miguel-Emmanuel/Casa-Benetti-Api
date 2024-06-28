import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {DocumentRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class DocumentsService {
    constructor(
        @repository(DocumentRepository)
        public documentRepository: DocumentRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
    ) { }



    async deleteById(id: number) {
        await this.validateDeleteDocument(id);
        await this.documentRepository.deleteById(id);
        return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito'});
    }


    async validateDeleteDocument(id: number) {
        const document = await this.documentRepository.findOne({where: {id}});
        if (!document)
            throw this.responseService.notFound("El documento no se ha encontrado.");

        if (document?.clientQuoteFileId || document?.providerFileId || document?.advanceFileId)
            throw this.responseService.badRequest("El documento no puede ser borrado.");

    }

}
