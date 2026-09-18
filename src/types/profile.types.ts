export interface IProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  role?: string;
  companyName?: string;
  avatarUrl?: string;
}

export const DEFAULT_PROFILE = {
  _id: "profile_current",
  name: "Priya Raman",
  email: "priya.raman@clientflow.example",
  role: "MERN Stack Developer",
  companyName: "Atelier North",
  avatarUrl: "",
} as const;
