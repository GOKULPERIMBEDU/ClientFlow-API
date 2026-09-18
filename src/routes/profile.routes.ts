import { Router } from "express";
import { profileController } from "../controllers/profile.controller.js";

const router = Router();

router.get("/", profileController.get);
router.put("/", profileController.update);

export default router;
