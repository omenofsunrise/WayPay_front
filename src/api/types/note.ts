export interface Note {
    id: number;
    content: string;
    createdAt: string;
    employeeId: number;
    creditId: number;
}

export interface CreateNoteRequest {
    creditId: number;
    content: string;
}