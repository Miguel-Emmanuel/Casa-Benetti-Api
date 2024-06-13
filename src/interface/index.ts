import {ExchangeRateE, TypeSaleE} from '../enums';
import {Address} from '../models';

export interface CreateQuotation {
    id: number,
    client: {
        clientId: number;
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
    },
    commissions: {
        isArchitect: boolean;
        architectName: string;
        commissionPercentageArchitect: number;
        isReferencedClient: boolean;
        commissionPercentagereferencedClient: number;
        referencedClientId: number;
        isProjectManager: boolean;
        projectManagers: {
            userId: number;
            commissionPercentageProjectManager: number;
        }[],
        isDesigner: boolean;
        designers: {
            userId: number;
            commissionPercentageDesigner: number;
        }[],
    },
    products: {
        productId: number;
        typeSale: TypeSaleE;
        isSeparate: boolean;
        percentageSeparate: number;
        reservationDays: number;
        quantity: number;
        percentageDiscountProduct: number;
        percentageAdditionalDiscount: number;
        subtotal: number;
    }[],
    quotation: {
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
