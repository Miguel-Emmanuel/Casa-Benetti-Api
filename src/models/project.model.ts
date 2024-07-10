import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {ProjectStatusE} from '../enums';
import {AdvancePaymentRecord} from './advance-payment-record.model';
import {BaseEntity} from './base/base-entity.model';
import {Branch, BranchWithRelations} from './branch.model';
import {CommissionPaymentRecord} from './commission-payment-record.model';
import {Customer, CustomerWithRelations} from './customer.model';
import {Document} from './document.model';
import {Proforma} from './proforma.model';
import {Quotation, QuotationWithRelations} from './quotation.model';

@model({
    settings: {
        postgresql: {
            table: 'project_Project' // Nombre de la tabla en PostgreSQL
        },
        foreignKeys: {
            fk_quotation_quotationId: {
                name: 'fk_quotation_quotationId',
                entity: 'Quotation',
                entityKey: 'id',
                foreignKey: 'quotationid',
            },
        }
    }
})
export class Project extends BaseEntity {
    @property({
        type: 'number',
        id: true,
        generated: true,
    })
    id: number;

    //ID del proyecto
    @property({
        type: 'string',
    })
    projectId: string;

    @belongsTo(() => Quotation)
    quotationId: number;

    @belongsTo(() => Branch)
    branchId: number;

    //Estatus del proyecto
    @property({
        type: 'string',
        default: ProjectStatusE.NUEVO
    })
    status: ProjectStatusE;

    @belongsTo(() => Customer)
    customerId: number;

    @hasOne(() => Document, {keyTo: 'clientQuoteFileId'})
    clientQuoteFile: Document;

    @hasOne(() => Document, {keyTo: 'providerFileId'})
    providerFile: Document;

    @hasMany(() => Document, {keyTo: 'advanceFileId'})
    advanceFile: Document[];

    @hasMany(() => Document)
    documents: Document[];

    //Registro del pago correspondiente a cada comisión
    @hasMany(() => CommissionPaymentRecord)
    commissionPaymentRecords: CommissionPaymentRecord[];

    //Registro del pago correspondiente a cada anticipo
    @hasMany(() => AdvancePaymentRecord)
    advancePaymentRecords: AdvancePaymentRecord[];

    @hasMany(() => Proforma)
    proformas: Proforma[];

    //Referencia
    @property({
        type: 'string',
    })
    reference: string;

    constructor(data?: Partial<Project>) {
        super(data);
    }
}

export interface ProjectRelations {
    // describe navigational properties here
    branch: BranchWithRelations,
    customer: CustomerWithRelations;
    quotation: QuotationWithRelations
}

export type ProjectWithRelations = Project & ProjectRelations;
