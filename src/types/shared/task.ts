// src/types/shared/task.ts

export enum TaskTypesEnum {
    FEATURE = 'FEATURE',
    BUG = 'BUG',
    EPIC = 'EPIC',
}

export enum TaskPrioritiesEnum {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}

export enum TaskEstimateUnitEnum {
    HOURS = "HOURS",
    DAYS = "DAYS"
}

export enum TaskSeverityEnum {
    MINOR = "MINOR",
    MAJOR = "MAJOR",
    CRITICAL = "CRITICAL"

}
export enum TaskComplexityEnum {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}


// ============================================================
// Arrays for Runtime Validation (Zod, etc.)
// ============================================================

export const TASK_TYPES = Object.values(TaskTypesEnum)
export const PRIORITIES = Object.values(TaskPrioritiesEnum);
export const ESTIMATE_UNITS = Object.values(TaskEstimateUnitEnum);
export const SEVERITIES = Object.values(TaskSeverityEnum);
export const COMPLEXITIES = Object.values(TaskComplexityEnum);

// ============================================================
// Primitive Types (Shared across all layers)
// ============================================================

export type TaskId = string;
export type TaskTitle = string;
export type TaskDescription = string;
export type TaskType = typeof TASK_TYPES[number];
export type Priority = typeof PRIORITIES[number];
export type EstimateValue = number;
export type EstimateUnit = typeof ESTIMATE_UNITS[number];
export type Severity = typeof SEVERITIES[number];
export type Complexity = typeof COMPLEXITIES[number];

// ============================================================
// Shared Task Interfaces
// ============================================================

/**
 * Fields shared by ALL task structures (create, update, response)
 */
export interface BaseTaskFields {
    title: TaskTitle;
    description: TaskDescription;
    priority: Priority;
    type: TaskType;
    columnId: string;
    severity?: Severity;
    complexity?: Complexity;
}

/**
 * For create/update operations (nested estimate)
 * Used by: CreateTaskDTO, UpdateTaskDTO, TaskCreationParams, CreateTaskInput
 */
export interface TaskFields extends BaseTaskFields {
    estimate: {
        value: EstimateValue;
        unit?: EstimateUnit;
    };
    assigneeId?: string | null;  // Optional for create/update
}

/**
 * For server responses (flat estimate)
 * Used by: TaskDTO, TaskData
 */
export interface TaskDTOFields extends BaseTaskFields {
    id: TaskId;
    estimate: EstimateValue;
    estimateUnit: EstimateUnit;
    assigneeId: string | null;   // Nullable for responses
    createdAt: string;
    updatedAt: string;
}