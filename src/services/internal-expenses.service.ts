import { /* inject, */ BindingScope, injectable} from '@loopback/core';

@injectable({scope: BindingScope.TRANSIENT})
export class InternalExpensesService {
    constructor(

    ) { }


}
