import { TASK_STATUS_VALUES, type TaskStatus } from "../types/task.types.js";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  testing_qa: "Testing / QA",
  client_review: "Client Review",
  completed: "Completed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as TaskStatus] ?? status;
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUS_VALUES as readonly string[]).includes(value);
}
