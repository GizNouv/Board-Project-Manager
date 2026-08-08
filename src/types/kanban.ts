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
}