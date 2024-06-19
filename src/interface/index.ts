import {ExchangeRateE, StatusQuotationE, TypeRegimenE, TypeSaleE} from '../enums';
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
    name: string;
    lastName: string;
    secondLastName: string;
    address?: Address;
    addressDescription?: string;
    phone: string;
    invoice: boolean;
    rfc: string;
    businessName: string;
    regimen: TypeRegimenE;
    groupId: number;
    groupName: string;
}

export interface QuotationI {
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
    advanceCustomer: number;
    conversionAdvance: number;
    balance: number;
}
export interface CreateQuotation {
    id: number,
    isDraft: boolean;
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: Products[],
    quotation: QuotationI
}

export interface QuotationFindResponse {
    id: number;
    customerName: string;
    pm: string | undefined;
    total: number;
    branchName: string | undefined;
    status: StatusQuotationE;
    updatedAt: Date | undefined;
}

export interface ProjectManagersById {
    id?: number;
    projectManagerName: string;
    commissionPercentageProjectManager: number;
}

export interface DesignersById {
    id?: number;
    designerName: string;
    commissionPercentageDesigner: number;
}

export interface ProductsById {
    SKU: string;
    brandName: string;
    status: string;
    description: string;
    image: string | undefined;
    mainFinish: string;

    sale: TypeSaleE | string;
    quantity: number;
    percentageDiscountProduct: number;
    discountProduct: number;
    percentageAdditionalDiscount: number;
    additionalDiscount: number;
    subtotal: number;
}
export interface QuotationFindOneResponse {
    customer: {
        customerId?: number;
        firstName: string;
        lastName: string;
        secondLastName: string;
        address?: Address,
        addressDescription?: string;
        phone: string;
        invoice: boolean;
        rfc: string;
        businessName: string;
        regimen: string;
        group: string
        groupId?: number;
    },
    products: ProductsById[],
    quotation: {
        subtotal: number;
        additionalDiscount: number;
        percentageIva: number;
        iva: number;
        total: number;
        advance: number;
        exchangeRate: ExchangeRateE;
        balance: number;
        isArchitect: boolean;
        architectName: string;
        commissionPercentageArchitect: number;
        isReferencedCustomer: boolean;
        referenceCustomerId?: number;
        commissionPercentagereferencedCustomer: number;
        percentageAdditionalDiscount: number;
        advanceCustomer: number;
        conversionAdvance: number;

    },
    commisions: {
        architectName: string;
        commissionPercentageArchitect: number;
        referencedCustomerName: string;
        projectManagers: ProjectManagersById[],
        designers: DesignersById[]

    }
}


export interface AssembledProductsE {
    description: string;
    SKU: string;
    document: {
        fileURL: string;
        name: string;
        extension: string;
    };
    mainMaterial: string;
    mainFinish: string;
    secondaryMaterial: string;
    secondaryFinishing: string;
    quantity: number;
    isActive: boolean;
}
