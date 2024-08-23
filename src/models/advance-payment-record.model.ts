import {Entity, belongsTo, hasMany, model, property} from '@loopback/repository';
import {getJsonSchema} from '@loopback/rest';
import {AdvancePaymentStatusE, ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE, ProductTypeE, TypeAdvancePaymentRecordE} from '../enums';
import {AccountsReceivable, AccountsReceivableWithRelations} from './accounts-receivable.model';
import {DocumentSchema} from './base/document.model';
import {Document} from './document.model';
import {Project} from './project.model';

//Cuentas por cobrar (pagos)
@model({
    settings: {
        postgresql: {
            table: 'project_AdvancePaymentRecord' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_accountsReceivable_accountsReceivableId: {
                name: 'fk_accountsReceivable_accountsReceivableId',
                entity: 'AccountsReceivable',
                entityKey: 'id',
                foreignKey: 'accountsreceivableid',
            },
            fk_project_proyectId: {
                name: 'fk_project_proyectId',
                entity: 'Project',
                entityKey: 'id',
                foreignKey: 'projectid',
            },
        }
    }
})
export class AdvancePaymentRecord extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    @property({
        type: 'number',
    })
    consecutiveId: number;

    //Fecha de creacion
    @property({
        type: 'date',
        default: () => new Date(),
    })
    createdAt: Date;

    //Fecha de pago
    @property({
        type: 'date',
    })
    paymentDate: Date;

    //Metodo de pago
    @property({
        type: 'string',
    })
    paymentMethod: PaymentTypeProofE;

    //Monto pagado
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    amountPaid: number;

    //Moneda de pago
    @property({
        type: 'string',
    })
    paymentCurrency: ExchangeRateE;

    //T.C./Paridad
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    parity: number;

    //Iva porcentaje
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageIva: number;

    //Desviacion venta
    @property({
        type: 'number',
        postgresql: {
            dataType: 'double precision',
        },
    })
    salesDeviation: number;

    @hasMany(() => Document)
    documents: Document[];

    //Relacion hacia cuentas por cobrar
    @belongsTo(() => AccountsReceivable)
    accountsReceivableId: number;

    //Moneda a aplicar
    @property({
        type: 'string',
    })
    currencyApply: ExchangeRateQuotationE;

    //Importe pagado
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    conversionAmountPaid: number;

    //Importe pagado sin iva
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotalAmountPaid: number;

    //Porcentaje de pago
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    paymentPercentage: number;

    //Estatus del pago
    @property({
        type: 'string',
        required: false,
        default: AdvancePaymentStatusE.PENDIENTE
    })
    status: AdvancePaymentStatusE;

    //Tipo de cobro
    @property({
        type: 'string',
        required: false,
    })
    type: TypeAdvancePaymentRecordE;

    @belongsTo(() => Project)
    projectId: number;

    //Referencia
    @property({
        type: 'string',
    })
    reference: string;

    //Tipo de producto
    @property({
        type: 'string',
        required: false,
    })
    productType: ProductTypeE;


    constructor(data?: Partial<AdvancePaymentRecord>) {
        super(data);
    }
}

export interface AdvancePaymentRecordRelations {
    // describe navigational properties here
    accountsReceivable: AccountsReceivableWithRelations
}

export type AdvancePaymentRecordWithRelations = AdvancePaymentRecord & AdvancePaymentRecordRelations;



export class AdvancePaymentRecordCreate extends AdvancePaymentRecord {
    @property({
        type: 'array',
        jsonSchema: {
            type: 'array',
            items: getJsonSchema(DocumentSchema)
        }
    })
    vouchers?: DocumentSchema[];
}
