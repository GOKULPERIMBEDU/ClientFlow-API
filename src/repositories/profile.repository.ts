import { ProfileModel, type ProfileHydratedDocument } from "../models/profile.model.js";
import { DEFAULT_PROFILE, type IProfile, type UpdateProfileDto } from "../types/profile.types.js";

function toProfile(doc: ProfileHydratedDocument): IProfile {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    companyName: doc.companyName,
    avatarUrl: doc.avatarUrl,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class ProfileRepository {
  async findCurrent(): Promise<IProfile | null> {
    const doc = await ProfileModel.findById(DEFAULT_PROFILE._id).exec();
    return doc ? toProfile(doc) : null;
  }

  async createDefault(): Promise<IProfile> {
    const doc = await ProfileModel.create({ ...DEFAULT_PROFILE });
    return toProfile(doc);
  }

  async updateCurrent(payload: UpdateProfileDto): Promise<IProfile | null> {
    const doc = await ProfileModel.findByIdAndUpdate(DEFAULT_PROFILE._id, payload, {
      new: true,
      runValidators: true,
    }).exec();
    return doc ? toProfile(doc) : null;
  }
}

export const profileRepository = new ProfileRepository();
