import { Router } from "express";
import { uploadController } from "../controllers/upload.controller.js";
import { commentUpload } from "../middleware/upload.js";

const router = Router();

router.post("/", commentUpload.single("file"), uploadController.create);

export default router;
