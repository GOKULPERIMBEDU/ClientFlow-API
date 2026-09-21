export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export interface IProject {
  id: string;
  clientId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  assignedTeam: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  clientId: string;
  name: string;
  description: string;
  status?: ProjectStatus;
  budget: number;
  currency?: string;
  startDate: string;
  endDate: string;
  assignedTeam?: string[];
}

export interface UpdateProjectDto {
  clientId?: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  budget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  assignedTeam?: string[];
}
