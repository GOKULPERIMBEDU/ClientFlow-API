export type UserRole = "admin" | "lead" | "member";

export function isAdminRole(role: UserRole | string): boolean {
  return role === "admin" || role === "lead";
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedProjects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  role?: UserRole;
  assignedProjects?: string[];
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  assignedProjects?: string[];
}
