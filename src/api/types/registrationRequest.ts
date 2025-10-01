export interface RegistrationResponse {
    id: number;
    phone: string;
    whatsApp: string;
    registrationPhrase: string;
    createdDate: Date;
}

export interface RegistrationFilesResponse {
    passportFirstPageBase64: string;
    passportRegistrationPageBase64: string;
    videoBase64: string;
}

export interface RegistrationApproveRequest {
    registrationRequestId: number;
    passportSeries: string;
    passportNumber: string;
    fullName: string;
    birthdate: Date;
    address?: string;
    docIssueDate?: Date;
}

export interface RegistrationRejectRequest {
    registrationRequestId: number;
    rejectReason: string;
}