import type { Request, Response } from "express";
import { taskService } from "../services/task.service.js";
import type { AddTaskAttachmentDto, AddTaskCommentDto, CreateTaskDto, UpdateTaskDto } from "../types/task.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class TaskController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const tasks = await taskService.listTasks(projectId, userId);
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
    const actor = typeof req.body?.actor === "string" ? req.body.actor : undefined;
    const task = await taskService.updateTask(req.params.id as string, req.body as UpdateTaskDto, actor);
    res.status(200).json({ success: true, data: task, message: "Task updated" });
  });

  addComment = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.addComment(req.params.id as string, req.body as AddTaskCommentDto);
    res.status(201).json({ success: true, data: task, message: "Comment added" });
  });

  addAttachment = asyncHandler(async (req: Request, res: Response) => {
    const actor = typeof req.body?.actor === "string" ? req.body.actor : undefined;
    const task = await taskService.addAttachment(
      req.params.id as string,
      req.body as AddTaskAttachmentDto,
      actor,
    );
    res.status(201).json({ success: true, data: task, message: "Attachment added" });
  });

  removeAttachment = asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.removeAttachment(
      req.params.id as string,
      req.params.attachmentId as string,
    );
    res.status(200).json({ success: true, data: task, message: "Attachment removed" });
  });

  getAttachment = asyncHandler(async (req: Request, res: Response) => {
    const file = await taskService.getAttachmentFile(
      req.params.id as string,
      req.params.attachmentId as string,
    );
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.name.replaceAll('"', "")}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.status(200).send(file.data);
  });

  getCommentAttachment = asyncHandler(async (req: Request, res: Response) => {
    const file = await taskService.getCommentAttachmentFile(
      req.params.id as string,
      req.params.commentId as string,
      req.params.attachmentId as string,
    );
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${file.name.replaceAll('"', "")}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.status(200).send(file.data);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await taskService.deleteTask(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Task deleted" });
  });
}

export const taskController = new TaskController();
