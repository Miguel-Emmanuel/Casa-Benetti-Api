import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ClassificationRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class ClassificationService {
    constructor(
        @repository(ClassificationRepository)
        public classificationRepository: ClassificationRepository,
    ) { }


    async findLineById(id: number) {
        return this.classificationRepository.lines(id).find();
    }

}
