import {ExchangeRateE, ExchangeRateQuotationE, PaymentTypeProofE, StatusQuotationE, TypeRegimenE, TypeSaleE} from '../enums';
import {Address, Document, ProofPaymentQuotationCreate} from '../models';

export interface ProjectManagers {
    userId: number;
    projectManagerCommissions?: MainProjectManagerCommissionsI[];
}

export interface Designers {
    userId: number;
    commissionPercentageDesigner: MainProjectManagerCommissionsI[];
}

export interface Products {
    productId: number;
    typeSale: TypeSaleE;
    isSeparate: boolean;
    percentageSeparate: number;
    reservationDays: number;
    quantity: number;
    provedorId: number;
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

export interface MainProjectManagerCommissionsI {
    classificationId: number, commissionPercentage: number, id: number
}

export interface QuotationI {
    mainProjectManagerId: number;
    mainProjectManagerCommissions?: MainProjectManagerCommissionsI[];
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
    exchangeRateQuotation: ExchangeRateQuotationE;
}
export interface Images {
    fileURL: string;
    name: string;
    extension: string;
}

// export interface ProofPaymentQuotationE {
//     paymentDate: string;
//     paymentType: PaymentTypeProofE;
//     exchangeRate: ExchangeRateE;
//     advanceCustomer: number;
//     conversionAdvance: number;
//     quotationId: number;
//     images: Images[]
// }
export interface CreateQuotation {
    id: number,
    isDraft: boolean;
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: Products[],
    quotation: QuotationI
    proofPaymentQuotation: ProofPaymentQuotationCreate[]
}

export interface BodyProofPayment {
    id: number;
    createdAt: Date;
    documents: Document[];
    paymentDate: Date;
    paymentType: PaymentTypeProofE;
    exchangeRate: ExchangeRateE;
    advanceCustomer: number;
    conversionAdvance: number;
    quotationId: number;
}

export interface UpdateQuotation {
    isDraft: boolean;
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: Products[],
    quotation: QuotationI,
    proofPaymentQuotation: ProofPaymentQuotationCreate[]
}

export interface QuotationFindResponse {
    id: number;
    customerName: string;
    pm: string | undefined;
    total: number | null;
    branchName: string | undefined;
    status: StatusQuotationE;
    updatedAt: Date | undefined;
}

export interface ProjectManagersById {
    id?: number;
    projectManagerName: string;
    classificationPercentageMainpms: MainProjectManagerCommissionsI[];
}

export interface DesignersById {
    id?: number;
    designerName: string;
    commissionPercentageDesigner: MainProjectManagerCommissionsI[];
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
        subtotal: number | null;
        additionalDiscount: number | null;
        percentageIva: number | null;
        iva: number | null;
        total: number | null;
        advance: number | null;
        exchangeRate: ExchangeRateE | null;
        balance: number | null;
        isArchitect: boolean;
        architectName: string;
        commissionPercentageArchitect: number | null;
        isReferencedCustomer: boolean;
        referenceCustomerId?: number | null;
        commissionPercentagereferencedCustomer: number | null;
        percentageAdditionalDiscount: number | null;
        advanceCustomer: number | null;
        conversionAdvance: number | null;
        status: string;
        mainProjectManagerId: number | null;
        rejectedComment?: string;
        mainProjectManagerCommissions: MainProjectManagerCommissionsI[];
    },
    commisions: {
        architectName: string;
        commissionPercentageArchitect: number;
        referencedCustomerName: string;
        projectManagers: ProjectManagersById[],
        designers: DesignersById[]

    },
    proofPaymentQuotations: any[]
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
