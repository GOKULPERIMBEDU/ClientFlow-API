export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface ITask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignee: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  projectId: string;
  assignee?: string;
  status?: TaskStatus;
}

export interface UpdateTaskDto {
  title?: string;
  projectId?: string;
  assignee?: string;
  status?: TaskStatus;
}
