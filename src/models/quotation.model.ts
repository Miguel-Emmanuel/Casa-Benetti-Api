import {Entity, hasMany, model, property} from '@loopback/repository';
import {ExchangeRateE, StatusQuotationE} from '../enums';
import {Product} from './product.model';
import {QuotationDesigner} from './quotation-designer.model';
import {QuotationProducts} from './quotation-products.model';
import {QuotationProjectManager} from './quotation-project-manager.model';
import {User} from './user.model';

@model({
    settings: {
        postgresql: {
            table: 'quotation_Quotation' // Nombre de la tabla en PostgreSQL
        },
        // foreignKeys: {
        //     fk_organization_organizationId: {
        //         name: 'fk_organization_organizationId',
        //         entity: 'Organization',
        //         entityKey: 'id',
        //         foreignKey: 'organizationid',
        //     },
        // }
    }
})
export class Quotation extends Entity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id?: number;

    //Hay Arquitecto o despacho
    @property({
        type: 'boolean',
        required: true,
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
    })
    commissionPercentageArchitect: number;

    //Hay  cliente referenciado
    @property({
        type: 'boolean',
        required: true,
    })
    isReferencedClient: boolean;

    //Comision del cliente referenciado
    @property({
        type: 'number',
        required: false,
    })
    commissionPercentagereferencedClient: number;

    //Se requiere project manager
    @property({
        type: 'boolean',
        required: true,
    })
    isProjectManager: boolean;

    @hasMany(() => User, {through: {model: () => QuotationProjectManager}})
    projectManagers: User[];

    //Se requiere proyectista
    @property({
        type: 'boolean',
        required: true,
    })
    isDesigner: boolean;

    @hasMany(() => User, {through: {model: () => QuotationDesigner}})
    designers: User[];

    @hasMany(() => Product, {through: {model: () => QuotationProducts}})
    products: Product[];

    //Subtotal
    @property({
        type: 'number',
        required: false,
    })
    subtotal: number;

    //Porcentaje descuento adicional
    @property({
        type: 'number',
        required: false,
    })
    percentageAdditionalDiscount: number;

    //descuento adicional total
    @property({
        type: 'number',
        required: false,
    })
    additionalDiscount: number;

    //Iva porcentaje
    @property({
        type: 'number',
        required: false,
    })
    percentageIva: number;

    //Iva total
    @property({
        type: 'number',
        required: false,
    })
    iva: number;

    //Total
    @property({
        type: 'number',
        required: false,
    })
    total: number;

    //Porcentaje anticipo
    @property({
        type: 'number',
        required: false,
    })
    percentageAdvance: number;

    //Anticipo total
    @property({
        type: 'number',
        required: false,
    })
    advance: number;

    //Tipo de cambio
    @property({
        type: 'string',
        required: false,
    })
    exchangeRate: ExchangeRateE;

    //Tipo de cambio monto
    @property({
        type: 'number',
        required: false,
    })
    exchangeRateAmount: number;

    //Saldo
    @property({
        type: 'number',
        required: false,
    })
    balance: number;

    //Estatus de la cotizacion
    @property({
        type: 'string',
    })
    status: StatusQuotationE;

    //Es borrador
    @property({
        type: 'boolean',
    })
    isDraft: boolean;

    constructor(data?: Partial<Quotation>) {
        super(data);
    }
}

export interface QuotationRelations {
    // describe navigational properties here
}

export type QuotationWithRelations = Quotation & QuotationRelations;
