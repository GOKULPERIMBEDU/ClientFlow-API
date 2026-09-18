import type { Request, Response } from "express";
import { profileService } from "../services/profile.service.js";
import type { UpdateProfileDto } from "../types/profile.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class ProfileController {
  get = asyncHandler(async (_req: Request, res: Response) => {
    const profile = await profileService.getProfile();
    res.status(200).json({ success: true, data: profile });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const profile = await profileService.updateProfile(req.body as UpdateProfileDto);
    res.status(200).json({ success: true, data: profile, message: "Profile updated" });
  });
}

export const profileController = new ProfileController();
