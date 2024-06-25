import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {ExchangeRateE, ExchangeRateQuotationE, StatusQuotationE} from '../enums';
import {BaseEntity} from './base/base-entity.model';
import {Branch, BranchWithRelations} from './branch.model';
import {Customer, CustomerWithRelations} from './customer.model';
import {Organization} from './organization.model';
import {Product, ProductWithRelations} from './product.model';
import {Project} from './project.model';
import {ProofPaymentQuotation, ProofPaymentQuotationWithRelations} from './proof-payment-quotation.model';
import {QuotationDesigner} from './quotation-designer.model';
import {QuotationProducts} from './quotation-products.model';
import {QuotationProjectManager} from './quotation-project-manager.model';
import {User, UserWithRelations} from './user.model';

@model({
    settings: {
        postgresql: {
            table: 'quotation_Quotation' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_customer_customerId: {
                name: 'fk_customer_customerId',
                entity: 'Customer',
                entityKey: 'id',
                foreignKey: 'customerid',
            },
            fk_user_referenceCustomerId: {
                name: 'fk_user_referenceCustomerId',
                entity: 'User',
                entityKey: 'id',
                foreignKey: 'referencecustomerid',
            },
            fk_organization_organizationId: {
                name: 'fk_organization_organizationId',
                entity: 'Organization',
                entityKey: 'id',
                foreignKey: 'organizationid',
            },
            fk_branch_branchId: {
                name: 'fk_branch_branchId',
                entity: 'Branch',
                entityKey: 'id',
                foreignKey: 'branchid',
            },
        }
    }
})
export class Quotation extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    //Cliente
    @belongsTo(() => Customer)
    customerId?: number;

    //Hay Arquitecto o despacho
    @property({
        type: 'boolean',
        required: false,
    })
    isArchitect: boolean;

    //Nombre del arquitecto
    @property({
        type: 'string',
        required: false,
    })
    architectName: string;

    //Comision del arquitecto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    commissionPercentageArchitect: number;

    //Hay  cliente referenciado
    @property({
        type: 'boolean',
        required: false,
    })
    isReferencedCustomer: boolean;

    @belongsTo(() => User)
    referenceCustomerId?: number;

    //Comision del cliente referenciado
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    commissionPercentagereferencedCustomer: number;

    //Se requiere project manager
    @property({
        type: 'boolean',
        required: false,
    })
    isProjectManager: boolean;

    @hasMany(() => User, {through: {model: () => QuotationProjectManager}})
    projectManagers: User[];

    //Se requiere proyectista
    @property({
        type: 'boolean',
        required: false,
    })
    isDesigner: boolean;

    @hasMany(() => User, {through: {model: () => QuotationDesigner}})
    designers: User[];

    @hasMany(() => Product, {through: {model: () => QuotationProducts}})
    products: Product[];

    @belongsTo(() => Organization)
    organizationId: number;

    @belongsTo(() => Branch)
    branchId: number;

    //Usuario que creo la cotizacion
    @belongsTo(() => User, {name: 'projectManager'})
    userId: number;

    //Estatus de la cotizacion
    @property({
        type: 'string',
        required: false,
    })
    status: StatusQuotationE;

    //Comentario para rechazada
    @property({
        type: 'string',
        required: false,
    })
    comment: string;

    //Es borrador
    @property({
        type: 'boolean',
        required: false,
    })
    isDraft: boolean;

    //Porcentaje de comision project manager principal
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageMainProjectManager: number;

    //Project manager principal
    @belongsTo(() => User)
    mainProjectManagerId: number;

    //Comprobante de anticipos
    @hasMany(() => ProofPaymentQuotation)
    proofPaymentQuotations: ProofPaymentQuotation[];


    //Tipo de cambio de la cotizacion
    @property({
        type: 'string',
        required: true,
        default: ExchangeRateQuotationE.EUR
    })
    exchangeRateQuotation: ExchangeRateQuotationE;


    //************************************************ COTIZACION EN EUROS *********************************** */

    //Subtotal
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotalEUR: number;

    //Porcentaje descuento adicional
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdditionalDiscountEUR: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    additionalDiscountEUR: number;


    //Iva porcentaje
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageIvaEUR: number;

    //Iva total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    ivaEUR: number;

    //Total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalEUR: number;

    //Porcentaje anticipo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdvanceEUR: number;

    //Anticipo total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceEUR: number;

    //Tipo de cambio
    @property({
        type: 'string',
        required: false,
    })
    exchangeRateEUR: ExchangeRateE;

    //Tipo de cambio monto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    exchangeRateAmountEUR: number;

    //Anticipo cliente
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceCustomerEUR: number;

    //Anticipo Conversión
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    conversionAdvanceEUR: number;

    //Saldo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    balanceEUR: number;

    //********************************MXN************************ */

    //Subtotal
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotalMXN: number;

    //Porcentaje descuento adicional
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdditionalDiscountMXN: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    additionalDiscountMXN: number;


    //Iva porcentaje
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageIvaMXN: number;

    //Iva total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    ivaMXN: number;

    //Total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalMXN: number;

    //Porcentaje anticipo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdvanceMXN: number;

    //Anticipo total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceMXN: number;

    //Tipo de cambio
    @property({
        type: 'string',
        required: false,
    })
    exchangeRateMXN: ExchangeRateE;

    //Tipo de cambio monto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    exchangeRateAmountMXN: number;

    //Anticipo cliente
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceCustomerMXN: number;

    //Anticipo Conversión
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    conversionAdvanceMXN: number;

    //Saldo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    balanceMXN: number;

    //********************************USD************************ */

    //Subtotal
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    subtotalUSD: number;

    //Porcentaje descuento adicional
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdditionalDiscountUSD: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    additionalDiscountUSD: number;


    //Iva porcentaje
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageIvaUSD: number;

    //Iva total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    ivaUSD: number;

    //Total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    totalUSD: number;

    //Porcentaje anticipo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    percentageAdvanceUSD: number;

    //Anticipo total
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceUSD: number;

    //Tipo de cambio
    @property({
        type: 'string',
        required: false,
    })
    exchangeRateUSD: ExchangeRateE;

    //Tipo de cambio monto
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    exchangeRateAmountUSD: number;

    //Anticipo cliente
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    advanceCustomerUSD: number;

    //Anticipo Conversión
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    conversionAdvanceUSD: number;

    //Saldo
    @property({
        type: 'number',
        required: false,
        postgresql: {
            dataType: 'double precision',
        },
    })
    balanceUSD: number;

    //********************************* */

    @hasOne(() => Project)
    project: Project;


    //Fecha de cierre de la cotizacion
    @property({
        type: 'date',
    })
    closingDate?: Date;

    constructor(data?: Partial<Quotation>) {
        super(data);
    }
}

export interface QuotationRelations {
    // describe navigational properties here
    projectManagers: User[],
    designers: User[],
    products: ProductWithRelations[];
    customer: CustomerWithRelations;
    referenceCustomer: UserWithRelations;
    branch: BranchWithRelations,
    projectManager: UserWithRelations
    proofPaymentQuotations: ProofPaymentQuotationWithRelations[]
}

export type QuotationWithRelations = Quotation & QuotationRelations;
