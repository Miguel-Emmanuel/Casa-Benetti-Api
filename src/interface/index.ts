import {ContainerStatus, ExchangeRateE, ExchangeRateQuotationE, InventoriesIssueE, InventoriesReasonE, PaymentTypeProofE, ShowRoomDestinationE, StatusQuotationE, TypeQuotationE, TypeRegimenE, TypeSaleE} from '../enums';
import {Address, Document, ProofPaymentQuotationCreate, QuotationProductsCreate} from '../models';

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
    email: string;
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
    subtotal: number;//showroom
    percentageAdditionalDiscount: number;//showroom
    additionalDiscount: number;//showroom
    percentageIva: number;//showroom
    iva: number;//showroom
    total: number;//showroom
    percentageAdvance: number;
    advance: number;
    exchangeRate: ExchangeRateE;
    advanceCustomer: number;
    conversionAdvance: number;
    balance: number;
    exchangeRateQuotation: ExchangeRateQuotationE; //showroom
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

export interface ProductsStock {
    id: number; //ID del quotationProduct
    typeSale: TypeSaleE;
    reservationDays: number;
    loanInitialDate: Date;
    loanEndDate: Date;
    discountProduct: number;
    quantity: number;
    originCost: number;
    price: number;
    factor: number;
    subtotal: number;
    percentageDiscountProduct: number;
    subtotalDiscount: number;
}
export interface CreateQuotation {
    id: number,
    isDraft: boolean;
    typeQuotation: TypeQuotationE;
    //Datos nivel cotizacion showroom
    branchId: number;
    branchesId: number[];
    showRoomDestination: ShowRoomDestinationE
    //Datos cotizacion general
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: QuotationProductsCreate[],
    quotation: QuotationI
    proofPaymentQuotation: ProofPaymentQuotationCreate[],
    productsStock: ProductsStock[],
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
    products: QuotationProductsCreate[],
    quotation: QuotationI,
    proofPaymentQuotation: ProofPaymentQuotationCreate[]
}

export interface QuotationFindResponse {
    id: number;
    customerName: string | null;
    pm: string | undefined;
    total: number | null;
    branchName: string | undefined | null;
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
    quantity: number;
    percentageDiscountProduct: number;
    discountProduct: number;
    percentageMaximumDiscount: number;
    maximumDiscount: number;
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
        email: string
    } | null,
    products: ProductsById[],
    quotation: {
        clientQuote?: Document
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
        typeQuotation?: TypeQuotationE;
        branchId?: number;
        showRoomDestination: ShowRoomDestinationE,
        branchesId: number[]
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


export interface EntryDataI {
    reasonEntry: InventoriesReasonE;
    containerId: number;
    collectionId: number;
    purchaseOrders: {id: number, products: {quotationProductsId: number, quantity: number}[];}[]
    branchId: number;
    warehouseId: number;
    projectId: string;
    quotationProductsId: number;
    quantity: number;
    comment: string;

    // destinationType: DestinationTypeE;
    destinationBranchId: number;
    destinationWarehouseId: number;
    destinationQuotationProductsId: number;
    // destinationId: number;
    destinationQuantity: number;
    commentEntry: string;
}

export interface IssueDataI {
    reasonIssue: InventoriesIssueE;
    branchId: number;
    warehouseId: number;
    quotationProductsId: number;
    quantity: number;
    comment: string;
    containerId: number;
    destinationBranchId: number;
    destinationWarehouseId: number;
}
export interface ProductsInventorieI {
    id: number
    name: string,
    sku: string,
    stock: number
    image: string | null,
    classificationId?: number,
    lineId?: number,
    brandId?: number,
    model: string,
    originCode: string,
    boxes: null,
    description: string,
    observations: string,
    assembledProducts: any,
    inventoryMovementId?: number,
    quantity: number
}
export interface InventorieDataI {
    id: number,
    name?: string,
    products: ProductsInventorieI[]
}
// export interface InventoriesWarehouseI {
//     warehouse: InventorieDataI[],
// }

// export interface InventoriesShowroomI {
//     showroom: InventorieDataI[],
// }

export interface Docs {
    id: number,
    fileURL: string,
    name: string,
    extension: string
}

export interface PurchaseOrdersContainer {
    id: number,
    products: {
        id: number,
        invoiceNumber: string,
        grossWeight: string,
        netWeight: string,
        numberBoxes: number,
        descriptionPedimiento: string,
        NOMS: string[]
    }[]
}
export interface UpdateContainer {
    pedimento: string;
    grossWeight: string;
    numberBoxes: number;
    measures: string;
    status: ContainerStatus;
    docs: Docs[],
    purchaseOrders: PurchaseOrdersContainer[]
}

export interface UpdateContainerProducts {
    purchaseOrders: PurchaseOrdersContainer[]
}


export interface UpdateQuotationI {
    mainProjectManagerId: number;
    mainProjectManagerCommissions?: MainProjectManagerCommissionsI[];

    isArchitect: boolean;
    architectName: string;
    commissionPercentageArchitect: number;

    isReferencedCustomer: boolean;
    referenceCustomerId: number;
    commissionPercentagereferencedCustomer: number;

    isDesigner: boolean;

    isProjectManager: boolean;

    subtotal: number;//showroom
    percentageAdditionalDiscount: number;//showroom
    additionalDiscount: number;//showroom
    percentageIva: number;//showroom
    iva: number;//showroom
    total: number;//showroom
    percentageAdvance: number;
    advance: number;
    exchangeRate: ExchangeRateE;
    advanceCustomer: number;
    conversionAdvance: number;
    balance: number;

    exchangeRateQuotation: ExchangeRateQuotationE; //showroom
}


export interface UpdateQuotationProject {
    id: number,
    typeQuotation: TypeQuotationE;
    customer: Customer,
    projectManagers: ProjectManagers[],
    designers: Designers[],
    products: QuotationProductsCreate[],
    quotation: UpdateQuotationI
    productsStock: ProductsStock[],
    proofPaymentQuotation: ProofPaymentQuotationCreate[],

    branchesId: number[];
    showRoomDestination: ShowRoomDestinationE
}
