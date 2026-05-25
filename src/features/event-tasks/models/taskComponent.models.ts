import type {
  Task,
  TaskCategory,
  TaskFormValues,
  TaskSummary,
  TeamMember,
  WeddingTemplate,
} from "./task.models";

export interface ProgressDashboardProps {
  readonly tasks: Task[];
  readonly summary: TaskSummary;
  readonly categories: TaskCategory[];
}

export interface TaskCardProps {
  readonly task: Task;
  readonly onClick: (task: Task) => void;
  readonly onQuickComplete: (task: Task) => void;
  readonly isOverdue?: boolean;
}

export interface TaskListProps {
  readonly tasks: Task[];
  readonly categories: TaskCategory[];
  readonly onTaskClick: (task: Task) => void;
  readonly onQuickComplete: (task: Task) => void;
  readonly onNewTask: () => void;
  readonly onDeleteTasks: (taskIds: string[]) => void;
}

export interface TaskCalendarProps {
  readonly tasks: Task[];
  readonly categories: TaskCategory[];
  readonly onTaskClick: (task: Task) => void;
  readonly onQuickComplete: (task: Task) => void;
  readonly onNewTask: () => void;
}

export interface TaskDetailModalProps {
  readonly task: Task | null;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onEdit: (task: Task) => void;
  readonly onDelete: (taskId: string) => void;
  readonly onStatusChange: (taskId: string, status: Task["status"]) => void;
}

export interface TaskFormModalProps {
  readonly open: boolean;
  readonly task?: Task | null;
  readonly categories: TaskCategory[];
  readonly members: TeamMember[];
  readonly onClose: () => void;
  readonly onSubmit: (values: TaskFormValues) => void;
}

export interface TemplateSelectorProps {
  readonly eventDate?: Date;
  readonly onApply: (
    template: WeddingTemplate,
    weddingDate: Date,
    includeOptional: boolean,
  ) => void;
}

export interface TemplateCardData {
  readonly id: string;
  readonly name: string;
  readonly flag: string;
  readonly description: string;
  readonly total_tasks: number;
  readonly required_tasks: number;
  readonly optional_tasks: number;
  readonly sections: number;
  readonly highlights: string[];
  readonly template: WeddingTemplate | null;
}
