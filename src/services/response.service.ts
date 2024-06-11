import {BindingScope, inject, injectable} from '@loopback/core';
import {Response, RestBindings} from '@loopback/rest';

interface ResponseInterface {
  [prop: string]: any;
}

@injectable({scope: BindingScope.TRANSIENT})
export class ResponseService {
  constructor(@inject(RestBindings.Http.RESPONSE) private response: Response) { }
  /*
   * Add service methods here
   */
  createResponse(returnResponse: ResponseInterface, statusCode?: number) {
    return this.response.status(statusCode || 200).send({data: returnResponse});
  }

  ok(data?: any) {
    return this.response.status(200).send({data: data} ?? {message: 'success'});
  }

  badRequest(message: string) {
    return this.response.status(400).send({message});
  }

  unauthorized(message: string) {
    return this.response.status(401).send({message});
  }

  forbbiden(message: string) {
    return this.response.status(403).send({message});
  }

  notFound(message: string) {
    return this.response.status(404).send({message});
  }

  unprocessableEntity(message: string) {
    return this.response.status(422).send({message});
  }

  internalServerError(message: any) {
    return this.response.status(500).send({message});
  }

  conflict(message: any) {
    return this.response.status(409).send({message});
  }
}
