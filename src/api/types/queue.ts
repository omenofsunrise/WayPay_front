import type { PaginationParams } from "./common";

export interface Queue {
    id: number,
    sum: number,
    clientId: number,
    createdAt: Date,
    priority: number,
    positionInQueue: number,
    clientFullName?: string;
    clientPhone?: string;
}

export interface QueueParams extends PaginationParams {
    name?: string
}