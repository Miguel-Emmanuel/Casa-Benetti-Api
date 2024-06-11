import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Filter, repository} from '@loopback/repository';
import {Module} from '../models';
import {ModuleRepository} from '../repositories';


@injectable({scope: BindingScope.TRANSIENT})
export class ModuleService {
    constructor(
        @repository(ModuleRepository)
        public moduleRepository: ModuleRepository,
    ) { }

    async findGroupedByCategory(filter?: Filter<Module>) {
        const modules = await this.moduleRepository.find(filter);

        if (!modules ?? modules.length <= 0) return []


        const groupList = modules.reduce((previousValue: any, currentValue: any) => {
            (previousValue[currentValue['categoryName']] = previousValue[currentValue['categoryName']] || []).push(currentValue);
            return previousValue;
        }, {});

        const lista = Object.keys(groupList);
        return lista?.map(module => ({
            category: module,
            modules: groupList[module]
        }))
    }
}
