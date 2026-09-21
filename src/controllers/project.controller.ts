import type { Request, Response } from "express";
import { projectService } from "../services/project.service.js";
import { userService } from "../services/user.service.js";
import type { CreateProjectDto, UpdateProjectDto } from "../types/project.types.js";
import { asyncHandler } from "../utils/async-handler.js";

export class ProjectController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const clientId = typeof req.query.clientId === "string" ? req.query.clientId : undefined;
    const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    let projects = clientId
      ? await projectService.listProjectsByClient(clientId)
      : await projectService.listProjects();

    if (userId) {
      const user = await userService.getUser(userId);
      const allowed = await userService.visibleProjectIds(user);
      if (allowed) {
        projects = projects.filter((project) => allowed.includes(project.id));
      }
    }

    res.status(200).json({ success: true, data: projects });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.getProject(req.params.id as string);
    res.status(200).json({ success: true, data: project });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.createProject(req.body as CreateProjectDto);
    res.status(201).json({ success: true, data: project, message: "Project created" });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const project = await projectService.updateProject(
      req.params.id as string,
      req.body as UpdateProjectDto,
    );
    res.status(200).json({ success: true, data: project, message: "Project updated" });
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await projectService.deleteProject(req.params.id as string);
    res.status(200).json({ success: true, data: { id: req.params.id }, message: "Project deleted" });
  });
}

export const projectController = new ProjectController();
