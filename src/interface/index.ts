import {TypeSaleE} from '../enums';
import {Address} from '../models';

export interface CreateQuotation {
    client: {
        clientId: number;
        firstName: string;
        lastName: string;
        motherLastName: string;
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
        projectManager: {
            userId: number;
            commissionPercentageProjectManager: number;
        }[],
        isDesigner: boolean;
        designer: {
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

    }
}
