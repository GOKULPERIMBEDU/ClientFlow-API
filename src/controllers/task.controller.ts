import type { Request, Response } from "express";
import { taskService } from "../services/task.service.js";
import type { CreateTaskDto, UpdateTaskDto } from "../types/task.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class TaskController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    const tasks = await taskService.listTasks(projectId);
    res.status(200).json({ success: true, data: tasks });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.getTask(req.params.id as string);
    res.status(200).json({ success: true, data: task });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.createTask(req.body as CreateTaskDto);
    res.status(201).json({ success: true, data: task, message: "Task created" });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.updateTask(req.params.id as string, req.body as UpdateTaskDto);
    res.status(200).json({ success: true, data: task, message: "Task updated" });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Task deleted" });
  });
}

export const taskController = new TaskController();
