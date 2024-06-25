import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Project} from '../models';
import {ProjectRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class ProjectService {
    constructor(
        @repository(ProjectRepository)
        public projectRepository: ProjectRepository,
    ) { }

    async create(project: Project) {
        return this.projectRepository.create(project);
    }


}
