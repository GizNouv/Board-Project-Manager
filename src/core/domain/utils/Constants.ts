export const DomainConstants = {
  TASK: {
    MAX_TITLE_LENGTH: 200,
    MIN_TITLE_LENGTH: 1,
    MAX_DESCRIPTION_LENGTH: 5000,
    MAX_ESTIMATE_HOURS: 100,
    MAX_ESTIMATE_DAYS: 20,
  },
  BOARD: {
    MAX_TITLE_LENGTH: 100,
    MIN_TITLE_LENGTH: 1,
    MAX_COLUMNS: 20,
    MAX_TASKS: 1000,
  },
  COLUMN: {
    MAX_TITLE_LENGTH: 100,
    MIN_TITLE_LENGTH: 1,
  },
  USER: {
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 1,
  },
  PRIORITY: {
    ORDER: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
  },
} as const;

export type PriorityOrder = typeof DomainConstants.PRIORITY.ORDER[number];