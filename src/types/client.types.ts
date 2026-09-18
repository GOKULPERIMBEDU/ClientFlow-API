export type ClientStatus = "active" | "onboarding" | "paused" | "archived";

export interface IClient {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: ClientStatus;
  timezone: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email: string;
  company: string;
  phone: string;
  status?: ClientStatus;
  timezone?: string;
  industry?: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  status?: ClientStatus;
  timezone?: string;
  industry?: string;
}
