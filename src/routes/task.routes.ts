import { Router } from "express";
import { taskController } from "../controllers/task.controller.js";

const router = Router();

router.get("/", taskController.list);
router.post("/", taskController.create);
router.get("/:id/attachments/:attachmentId", taskController.getAttachment);
router.post("/:id/attachments", taskController.addAttachment);
router.delete("/:id/attachments/:attachmentId", taskController.removeAttachment);
router.post("/:id/comments", taskController.addComment);
router.get("/:id/comments/:commentId/attachments/:attachmentId", taskController.getCommentAttachment);
router.get("/:id", taskController.getById);
router.put("/:id", taskController.update);
router.delete("/:id", taskController.remove);

export default router;
