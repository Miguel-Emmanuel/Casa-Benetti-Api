import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {ResponseServiceBindings} from '../keys';
import {Document, Proforma} from '../models';
import {BrandRepository, DocumentRepository, ProformaRepository, ProjectRepository, ProviderRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class ProformaService {
  constructor(
    @repository(ProformaRepository)
    public proformaRepository: ProformaRepository,
    @inject(ResponseServiceBindings.RESPONSE_SERVICE)
    public responseService: ResponseService,
    @repository(DocumentRepository)
    public documentRepository: DocumentRepository,
    @repository(ProviderRepository)
    public providerRepository: ProviderRepository,
    @repository(BrandRepository)
    public brandRepository: BrandRepository,
    @repository(ProjectRepository)
    public projectRepository: ProjectRepository,
  ) { }

  async create(data: {proforma: Omit<Proforma, 'id'>, document: Document}) {
    try {
      const {proforma, document} = data
      const findProviderBrand = await this.findProviderBrand(proforma)

      if (findProviderBrand)
        return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

      if (!document)
        return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');

      const newProforma = await this.proformaRepository.create({...proforma});
      await this.createDocument(newProforma.id, document)
      return newProforma
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async createDocument(proformaId: number | undefined, document: Document) {
    if (proformaId) {
      if (document && !document?.id) {
        await this.proformaRepository.document(proformaId).create(document);
      } else if (document) {
        await this.documentRepository.updateById(document.id, {...document});
      }
    }
  }

  async find(filter?: Filter<Proforma>) {
    try {
      return this.proformaRepository.find(filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findById(id: number, filter?: Filter<Proforma>) {
    try {
      return this.proformaRepository.findById(id, filter);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async count(where?: Where<Proforma>) {
    try {
      return this.proformaRepository.count(where);
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async updateById(id: number, data: {proforma: Omit<Proforma, 'id'>, document: Document}) {
    try {
      const {proforma, document} = data

      await this.findByIdProforma(id)
      await this.findByIdProvider(proforma.providerId)
      await this.findByIdProject(proforma.projectId)
      await this.findByIdBrand(proforma.brandId)
      const findProviderBrand = await this.findProviderBrand(proforma)

      if (findProviderBrand)
        return this.responseService.badRequest('¡Oh, no! Ya hay un registro con esta marca y proveedor, revisa por favor e intenta de nuevo.');

      if (!document)
        return this.responseService.badRequest('¡Oh, no! Debes subir un documento de Proforma');
      await this.proformaRepository.updateById(id, proforma);
      return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
    } catch (error) {
      return this.responseService.internalServerError(
        error.message ? error.message : error
      );
    }
  }

  async findProviderBrand(proforma: Proforma): Promise<boolean> {
    const {projectId, providerId, brandId} = proforma
    const findProviderBrand = await this.proformaRepository.findOne({
      where: {
        projectId,
        providerId,
        brandId,
      }
    })
    return findProviderBrand ? true : false
  }
  async findByIdProforma(id: number) {
    const proforma = await this.proformaRepository.findOne({where: {id}});
    if (!proforma)
      throw this.responseService.notFound("La proforma no se ha encontrado.")
  }
  async findByIdProvider(id?: number) {
    const provider = await this.providerRepository.findOne({where: {id}});
    if (!provider)
      throw this.responseService.notFound("El proveedor no se ha encontrado.")
  }
  async findByIdProject(id?: number) {
    const project = await this.projectRepository.findOne({where: {id}});
    if (!project)
      throw this.responseService.notFound("El proyecto no se ha encontrado.")
  }
  async findByIdBrand(id?: number) {
    const brand = await this.brandRepository.findOne({where: {id}});
    if (!brand)
      throw this.responseService.notFound("La marca no se ha encontrado.")
  }
}
