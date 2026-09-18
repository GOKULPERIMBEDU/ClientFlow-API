import { Router } from "express";
import { clientController } from "../controllers/client.controller.js";

const router = Router();

router.get("/", clientController.list);
router.get("/:id", clientController.getById);
router.post("/", clientController.create);
router.put("/:id", clientController.update);
router.delete("/:id", clientController.remove);

export default router;
