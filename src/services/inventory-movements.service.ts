import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {InventoryMovements} from '../models';
import {InventoryMovementsRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class InventoryMovementsService {
    constructor(
        @repository(InventoryMovementsRepository)
        public inventoryMovementsRepository: InventoryMovementsRepository,
    ) { }

    async entry(inventoryMovements: Omit<InventoryMovements, 'id'>,) {
        return this.inventoryMovementsRepository.create(inventoryMovements);
    }


}
