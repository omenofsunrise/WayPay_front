export type DateDirection = typeof DateDirection[keyof typeof DateDirection];

export const DateDirection = {
    Before: 1,
    After: 2,
} as const;

export type TextPatternType = typeof TextPatternType[keyof typeof TextPatternType];

export const TextPatternType = {
    ComingPayment: 1,
    OverduePayment: 2,
} as const;

export interface SenderInfoResponse {
    isSenderTurnedOn: boolean;
    shouldAutoBuyMessages: boolean;
    licenceDays: number;

    comingPaymentContent: boolean;
    overduePaymentContent: number;

    messagesCount: number;

    senderSettingResponses: SenderSettingResponse[];
}
    
export interface SenderSettingResponse
{
    id: number;
    days: number;
    direction: DateDirection;
}

export interface SetSenderTextRequest
{
    newText: string;
    patternType: TextPatternType;
}

export interface CreateSenderSetting
{
    days: number;
    direction: DateDirection;
}