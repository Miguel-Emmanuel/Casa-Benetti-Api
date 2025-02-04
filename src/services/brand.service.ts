import { /* inject, */ BindingScope, inject, injectable} from '@loopback/core';
import {Filter, Where, repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {ResponseServiceBindings} from '../keys';
import {Brand} from '../models';
import {BrandRepository} from '../repositories';
import {ResponseService} from './response.service';

@injectable({scope: BindingScope.TRANSIENT})
export class BrandService {
    constructor(
        @repository(BrandRepository)
        public brandRepository: BrandRepository,
        @inject(ResponseServiceBindings.RESPONSE_SERVICE)
        public responseService: ResponseService,
        @inject(SecurityBindings.USER)
        private user: UserProfile,
    ) { }

    async create(brand: Brand) {
        try {
            return this.brandRepository.create({...brand, /*organizationId: this.user.organizationId*/});
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async find(filter?: Filter<Brand>) {
        try {
            return this.brandRepository.find(filter);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async findById(id: number, filter?: Filter<Brand>) {
        try {
            return this.brandRepository.findById(id, filter);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async getProvidersById(id: number, filter?: Filter<Brand>) {
        try {
            return this.brandRepository.providers(id).find()
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }



    async count(where?: Where<Brand>) {
        try {
            return this.brandRepository.count(where);
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }

    async updateById(id: number, brand: Brand,) {
        try {
            await this.brandRepository.updateById(id, brand);
            return this.responseService.ok({message: '¡En hora buena! La acción se ha realizado con éxito.'});
        } catch (error) {
            return this.responseService.internalServerError(
                error.message ? error.message : error
            );
        }
    }
}
