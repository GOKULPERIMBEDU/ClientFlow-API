import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import type { CreateUserDto, UpdateUserDto } from "../types/user.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class UserController {
  list = asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.listUsers();
    res.status(200).json({ success: true, data: users });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUser(req.params.id as string);
    res.status(200).json({ success: true, data: user });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body as CreateUserDto);
    res.status(201).json({ success: true, data: user, message: "User created" });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params.id as string, req.body as UpdateUserDto);
    res.status(200).json({ success: true, data: user, message: "User updated" });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "User deleted" });
  });
}

export const userController = new UserController();
