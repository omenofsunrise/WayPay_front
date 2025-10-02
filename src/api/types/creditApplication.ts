export interface CreditApplicationResponse {
    id: number;

    productName: string;

    productPrice: number;

    firstPayment: number;

    termMonths: number;

    region: string;
    district: string;

    createdDate: Date;

    clientId: number;
    fullname: string;
    avatarPath?: string;
}