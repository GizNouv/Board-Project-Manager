/**
 * Data Transfer Objects for Task operations
 * Used by application services to communicate with the outside world
 */
export interface CreateTaskDTO {
  title: string;
  description: string;
  estimate: {
    value: number;
    unit?: 'hours' | 'days';
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  columnId: string;
  type: 'BUG' | 'FEATURE' | 'EPIC';
  severity?: 'minor' | 'major' | 'critical';
  complexity?: 'low' | 'medium' | 'high';
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  estimate?: {
    value: number;
    unit?: 'hours' | 'days';
  };
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string | null;
  severity?: 'minor' | 'major' | 'critical';
  complexity?: 'low' | 'medium' | 'high';
}

export interface MoveTaskDTO {
  taskId: string;
  fromColumnId: string;
  toColumnId: string;
}

export interface ReorderTaskDTO {
  taskId: string;
  columnId: string;
  position: number;
}

export interface TaskResponseDTO {
  id: string;
  title: string;
  description: string;
  estimate: number;
  estimateUnit: string;
  priority: string;
  type: string;
  assigneeId: string | null;
  columnId: string;
  createdAt: Date;
  updatedAt: Date;
}