import { Router } from "express";
import clientRoutes from "./client.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import profileRoutes from "./profile.routes.js";
import projectRoutes from "./project.routes.js";
import taskRoutes from "./task.routes.js";
import uploadRoutes from "./upload.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/profile", profileRoutes);
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/uploads", uploadRoutes);

export default router;
