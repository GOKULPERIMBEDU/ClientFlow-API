import { Router } from "express";
import { invoiceController } from "../controllers/invoice.controller.js";

const router = Router();

router.get("/", invoiceController.list);
router.get("/:id", invoiceController.getById);
router.post("/", invoiceController.create);
router.put("/:id", invoiceController.update);
router.delete("/:id", invoiceController.remove);

export default router;
