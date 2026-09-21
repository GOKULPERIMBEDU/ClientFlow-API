import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { corsOptions } from "./config/cors.js";
import { connectDatabase, isDatabaseConnected } from "./config/db.js";
import { seedIfEmpty } from "./config/seed.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "8mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: "clientflow-api",
      status: "ok",
      database: isDatabaseConnected() ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/", (_req, res) => {
  res.status(200).send("ClientFlow API is awake and running!");
});

app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();
  await seedIfEmpty(); // workspace defaults, including team and task history

  app.listen(port, () => {
    console.log(`ClientFlow API listening on http://localhost:${port}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start ClientFlow API", error);
  process.exit(1);
});
