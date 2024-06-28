import {belongsTo, hasMany, hasOne, model, property} from '@loopback/repository';
import {ProjectStatusE} from '../enums';
import {AdvancePaymentRecord} from './advance-payment-record.model';
import {BaseEntity} from './base/base-entity.model';
import {Branch, BranchWithRelations} from './branch.model';
import {CommissionPaymentRecord} from './commission-payment-record.model';
import {Customer, CustomerWithRelations} from './customer.model';
import {Document} from './document.model';
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

    @hasMany(() => CommissionPaymentRecord)
    commissionPaymentRecords: CommissionPaymentRecord[];

    @hasMany(() => AdvancePaymentRecord)
    advancePaymentRecords: AdvancePaymentRecord[];

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
