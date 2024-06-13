import {ExchangeRateE, TypeSaleE} from '../enums';
import {Address} from '../models';

export interface ProjectManagers {
    userId: number;
    commissionPercentageProjectManager: number;
}

export interface Designers {
    userId: number;
    commissionPercentageDesigner: number;
}

export interface Products {
    productId: number;
    typeSale: TypeSaleE;
    isSeparate: boolean;
    percentageSeparate: number;
    reservationDays: number;
    quantity: number;
    percentageDiscountProduct: number;
    percentageAdditionalDiscount: number;
    subtotal: number;
}

export interface Customer {
    customerId: number;
    firstName: string;
    lastName: string;
    secondLastName: string;
    address: Address;
    addressDescription: string;
    phone: string;
    isInvoice: string;
    rfc: string;
    businessName: string;
    groupId: number;
}
export interface CreateQuotation {
    id: number,
    isDraft: boolean;
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: Products[],
    quotation: {
        referenceCustomerId: number;
        isDesigner: boolean;
        isArchitect: boolean;
        architectName: string;
        commissionPercentageArchitect: number;
        isReferencedCustomer: boolean;
        commissionPercentagereferencedCustomer: number;
        isProjectManager: boolean;
        subtotal: number;
        percentageAdditionalDiscount: number;
        additionalDiscount: number;
        percentageIva: number;
        iva: number;
        total: number;
        percentageAdvance: number;
        advance: number;
        exchangeRate: ExchangeRateE;
        balance: number;
    }
}
