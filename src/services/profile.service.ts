import { AppError } from "../errors/app-error.js";
import { profileRepository, type ProfileRepository } from "../repositories/profile.repository.js";
import type { IProfile, UpdateProfileDto } from "../types/profile.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  async getProfile(): Promise<IProfile> {
    const existing = await this.profiles.findCurrent();
    if (existing) {
      return existing;
    }
    return this.profiles.createDefault();
  }

  async updateProfile(payload: UpdateProfileDto): Promise<IProfile> {
    await this.getProfile();
    this.assertUpdatePayload(payload);

    const updated = await this.profiles.updateCurrent({
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.email ? { email: payload.email.trim().toLowerCase() } : {}),
      ...(payload.role ? { role: payload.role.trim() } : {}),
      ...(payload.companyName ? { companyName: payload.companyName.trim() } : {}),
      ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl.trim() } : {}),
    });

    if (!updated) {
      throw AppError.notFound("Profile");
    }

    return updated;
  }

  private assertUpdatePayload(payload: UpdateProfileDto): void {
    if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
      throw AppError.badRequest("Invalid email address");
    }

    if (payload.avatarUrl && payload.avatarUrl.trim().length > 0) {
      try {
        new URL(payload.avatarUrl);
      } catch {
        throw AppError.badRequest("Avatar URL must be a valid URL");
      }
    }
  }
}

export const profileService = new ProfileService(profileRepository);
