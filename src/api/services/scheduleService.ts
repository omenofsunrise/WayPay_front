import apiClient from '../client';
import type { 
    ScheduleItem, 
    ScheduleDetails, 
    ScheduleParams, 
    SchedulePreviewParams,
    ScheduleCalendarParams,
    UpdateScheduleRequest
} from '../types/schedule';
import type { PaginatedResponse } from '../types/common';

type CalendarResponse =
    | ScheduleDetails[]
    | PaginatedResponse<ScheduleDetails>
    | Record<string, unknown>;

const getValue = <T>(source: Record<string, unknown>, ...keys: string[]): T | undefined => {
    for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null) {
            return source[key] as T;
        }
    }
    return undefined;
};

const getArrayValue = (source: Record<string, unknown>, ...keys: string[]): unknown[] | undefined => {
    const value = getValue<unknown>(source, ...keys);
    return Array.isArray(value) ? value : undefined;
};

const unwrapCalendarItems = (data: CalendarResponse): unknown[] => {
    if (Array.isArray(data)) {
        return data;
    }

    const wrappedItems = getArrayValue(
        data,
        'items',
        'Items',
        'data',
        'Data',
        'result',
        'Result',
        'rows',
        'Rows',
        'clients',
        'Clients',
        'schedules',
        'Schedules',
        'payments',
        'Payments'
    );
    return wrappedItems ?? [];
};

const normalizeScheduleDetails = (
    rawItem: unknown,
    parentContext?: Record<string, unknown>
): ScheduleDetails | null => {
    if (!rawItem || typeof rawItem !== 'object') {
        return null;
    }

    const item = rawItem as Record<string, unknown>;
    const context = parentContext ?? {};

    return {
        id: getValue<number>(item, 'id', 'Id') ?? 0,
        creditId: getValue<number>(item, 'creditId', 'CreditId') ?? 0,
        rest: getValue<number>(item, 'rest', 'Rest') ?? 0,
        paymentDate: getValue<Date>(item, 'paymentDate', 'PaymentDate', 'date', 'Date') ?? new Date(''),
        paymentAmount: getValue<number>(item, 'paymentAmount', 'PaymentAmount', 'amount', 'Amount') ?? 0,
        clientName: getValue<string>(item, 'clientName', 'ClientName', 'clientFullName', 'ClientFullName')
            ?? getValue<string>(context, 'clientName', 'ClientName', 'clientFullName', 'ClientFullName')
            ?? '',
        comment: getValue<string>(item, 'comment', 'Comment') ?? '',
        notified: getValue<boolean>(item, 'notified', 'Notified') ?? false,
        isPaid: getValue<boolean>(item, 'isPaid', 'IsPaid'),
        paidDate: getValue<Date>(item, 'paidDate', 'PaidDate'),
        clientPhone: getValue<string>(item, 'clientPhone', 'ClientPhone')
            ?? getValue<string>(context, 'clientPhone', 'ClientPhone')
            ?? '',
        guarantorFullname: getValue<string>(item, 'guarantorFullname', 'GuarantorFullname', 'guarantorFullName', 'GuarantorFullName')
            ?? getValue<string>(context, 'guarantorFullname', 'GuarantorFullname', 'guarantorFullName', 'GuarantorFullName'),
        guarantorPhone: getValue<string>(item, 'guarantorPhone', 'GuarantorPhone')
            ?? getValue<string>(context, 'guarantorPhone', 'GuarantorPhone'),
        payed: getValue<boolean>(item, 'payed', 'Payed'),
        userComment: getValue<string | null>(item, 'userComment', 'UserComment') ?? null,
        status: getValue<ScheduleDetails['status']>(item, 'status', 'Status')
    };
};

const normalizeCalendarResponse = (data: CalendarResponse): ScheduleDetails[] => {
    return unwrapCalendarItems(data).flatMap(item => {
        if (!item || typeof item !== 'object') {
            return [];
        }

        const itemObject = item as Record<string, unknown>;
        const nestedItems = getArrayValue(
            itemObject,
            'payments',
            'Payments',
            'items',
            'Items',
            'schedules',
            'Schedules',
            'calendar',
            'Calendar'
        );

        if (nestedItems) {
            return nestedItems
                .map(nestedItem => normalizeScheduleDetails(nestedItem, itemObject))
                .filter((schedule): schedule is ScheduleDetails => Boolean(schedule));
        }

        const normalizedItem = normalizeScheduleDetails(itemObject);
        return normalizedItem ? [normalizedItem] : [];
    });
};

class ScheduleService {
    async getList(params?: ScheduleParams): Promise<PaginatedResponse<ScheduleDetails>> {
        const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
            '/Schedule',
            { params }
        );
        return response.data;
    }

    async getByCreditId(
        creditId: number, 
        params?: Omit<ScheduleParams, 'creditId'>
    ): Promise<PaginatedResponse<ScheduleDetails>> {
        const response = await apiClient.get<PaginatedResponse<ScheduleDetails>>(
            `/Schedule/by-credit/${creditId}`,
            { params }
        );
        return response.data;
    }

    async getById(id: number): Promise<ScheduleDetails> {
        const response = await apiClient.get<ScheduleDetails>(`/Schedule/${id}`);
        return response.data;
    }

    async getCalendar(params?: ScheduleCalendarParams): Promise<ScheduleDetails[]> {
        const response = await apiClient.get<CalendarResponse>('/Schedule/calendar', { params });
        return normalizeCalendarResponse(response.data);
    }

    async markAsNotified(id: number): Promise<void> {
        await apiClient.put(`/Schedule/${id}`);
    }

    async updateDate(id: number, date: string): Promise<void> {
        await apiClient.put('/Schedule', { id, date });
    }

    async updateSchedule(request: UpdateScheduleRequest): Promise<void> {
        await apiClient.put('/Schedule', request);
    }

    async getPreview(params: SchedulePreviewParams): Promise<ScheduleItem[]> {
        const response = await apiClient.post<ScheduleItem[]>(
            '/Schedule/preview',
            params
        );
        return response.data;
    }
}

export default new ScheduleService();
