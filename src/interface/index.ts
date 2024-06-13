import {ExchangeRateE, StatusQuotationE, TypeSaleE} from '../enums';
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
    discountProduct: number;
    percentageAdditionalDiscount: number;
    additionalDiscount: number;
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
    taxRegime: string;
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

export interface QuotationFindResponse {
    id: number;
    customerName: number;
    pm: string | undefined;
    total: number;
    branchName: string;
    status: StatusQuotationE;
    updatedAt: Date | undefined;
}


export interface QuotationFindOneResponse {
    customer: {
        firstName: string;
        lastName: string;
        secondLastName: string;
        // address: Address,
        address: string,
        addressDescription: string;
        phone: string;
        invoice: boolean;
        rfc: string;
        businessName: string;
        taxRegime: string;
        group: string
    },
    products: {
        SKU: string;
        brandName: string;
        status: string;
        description: string;
        image: string;
        mainFinish: string;
        sale: boolean;
        quantity: number;
        percentageDiscountProduct: number;
        discountProduct: number;
        percentageAdditionalDiscount: number;
        additionalDiscount: number;
        subtotal: number;
    }[],
    quotation: {
        subtotal: number;
        additionalDiscount: number;
        percentageIva: number;
        iva: number;
        total: number;
        advance: number;
        exchangeRate: ExchangeRateE;
        balance: number;
    },
    commisions: {
        architectName: string;
        commissionPercentageArchitect: number;
        referencedCustomerName: string;
        projectManagers: {
            projectManagerName: string;
            commissionPercentageProjectManager: number;
        }[],
        designers: {
            designerName: string;
            commissionPercentageDesigner: number;
        }[]

    }
}
