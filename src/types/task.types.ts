export const TASK_STATUS_VALUES = [
  "backlog",
  "todo",
  "in_progress",
  "testing_qa",
  "client_review",
  "completed",
] as const;

export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];
export const DEFAULT_TASK_STATUS: TaskStatus = "backlog";

export type TaskActivityType = "created" | "status" | "assignee" | "comment" | "update" | "attachment" | "worklog";

export interface TaskActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  actionType: TaskActivityType;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorId: string;
  body: string;
  content: string;
  attachments: TaskAttachment[];
  mentions: string[];
  createdAt: string;
}

export interface TaskActivity extends TaskActivityLogEntry {
  type: TaskActivityType;
  author: string;
  message: string;
  createdAt: string;
}

export interface ActivityActor {
  userId?: string;
  userName?: string;
}

export interface ITask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  status: TaskStatus;
  description: string;
  dueDate: string;
  estimatedHours: number;
  spentHours: number;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
  activityLog: TaskActivityLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  projectId: string;
  assignee?: string;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  spentHours?: number;
  actorId?: string;
  actorName?: string;
}

export interface UpdateTaskDto {
  title?: string;
  projectId?: string;
  assignee?: string;
  status?: TaskStatus;
  description?: string;
  dueDate?: string;
  estimatedHours?: number;
  spentHours?: number;
  actorId?: string;
  actorName?: string;
}

export interface AddTaskCommentDto {
  body?: string;
  content?: string;
  author?: string;
  actorId?: string;
  mentions?: string[];
  attachments?: AddTaskAttachmentDto[];
}

export interface AddTaskAttachmentDto {
  name: string;
  mimeType: string;
  contentBase64: string;
  actorId?: string;
  actorName?: string;
}

export interface AppendActivityDto {
  userId?: string;
  userName: string;
  actionType: TaskActivityType;
  oldValue?: string;
  newValue?: string;
  message?: string;
}
