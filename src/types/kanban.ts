export interface TaskData {
    id: string;
    title: string;
    description: string;
    estimate: {
        value: number;
        unit: string;
    };
    priority: {
        value: string;
    };
    type: string;
    assigneeId: string | null;
    columnId: string;
    severity?: 'minor' | 'major' | 'critical';
    complexity?: 'low' | 'medium' | 'high';
}

export interface ColumnData {
    id: string;
    title: string;
    boardId: string;
    order: number;
    tasks: TaskData[];
}

export interface BoardData {
    id: string;
    title: string;
    columns: ColumnData[];
    createdAt?: string;
    updatedAt?: string;
}