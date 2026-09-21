import multer from "multer";
import { AppError } from "../errors/app-error.js";
import { isAllowedUploadType, maxUploadBytes } from "../services/file-storage.js";

export const commentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes(), files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedUploadType(file.mimetype)) {
      callback(AppError.badRequest("Upload JPEG, PNG, GIF, WebP, PDF, or an Office document"));
      return;
    }
    callback(null, true);
  },
});
