import type { PaginationParams } from "./common";

export interface Queue {
    id: number,
    sum: number,
    clientId: number,
    createdAt: Date,
    priority: 1 | 2,
    positionInQueue: number,
}

export interface QueueParams extends PaginationParams {
    name?: string
}