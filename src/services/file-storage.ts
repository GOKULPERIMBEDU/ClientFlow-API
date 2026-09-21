import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StoredUpload {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

type StorageDriver = "local" | "s3" | "cloudinary";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

export function maxUploadBytes(): number {
  return MAX_UPLOAD_BYTES;
}

export function isAllowedUploadType(mimeType: string): boolean {
  return ALLOWED_TYPES.has(mimeType);
}

function driver(): StorageDriver {
  const explicit = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (explicit === "s3" || explicit === "cloudinary" || explicit === "local") {
    return explicit;
  }
  if (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL) {
    return "cloudinary";
  }
  if (process.env.S3_BUCKET) {
    return "s3";
  }
  return "local";
}

function safeName(name: string): string {
  const base = path.basename(name || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");
  return (base || "upload").slice(0, 80);
}

function publicApiOrigin(): string {
  return (process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, "");
}

async function saveLocal(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredUpload> {
  const id = crypto.randomUUID();
  const filename = `${id}-${safeName(file.originalname)}`;
  const folder = path.resolve(process.cwd(), "uploads", "comments");
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, filename), file.buffer);
  return {
    id,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.buffer.length,
    url: `/uploads/comments/${filename}`,
    uploadedAt: new Date().toISOString(),
  };
}

async function saveS3(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredUpload> {
  const bucket = process.env.S3_BUCKET?.trim();
  if (!bucket) {
    throw new Error("S3_BUCKET is not configured");
  }
  const id = crypto.randomUUID();
  const key = `comments/${id}-${safeName(file.originalname)}`;
  const region = process.env.AWS_REGION?.trim() || "us-east-1";
  const client = new S3Client({ region });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  const url = publicBase
    ? `${publicBase}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return {
    id,
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.buffer.length,
    url,
    uploadedAt: new Date().toISOString(),
  };
}

function cloudinaryCredentials(): { cloud: string; apiKey: string; apiSecret: string } {
  const fromUrl = process.env.CLOUDINARY_URL?.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);
  if (fromUrl?.[1] && fromUrl[2] && fromUrl[3]) {
    return { apiKey: fromUrl[1], apiSecret: fromUrl[2], cloud: fromUrl[3] };
  }
  return {
    cloud: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() ?? "",
  };
}

async function saveCloudinary(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredUpload> {
  const { cloud, apiKey, apiSecret } = cloudinaryCredentials();
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "clientflow/comments";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  body.append("folder", folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: "POST",
    body,
  });
  const payload = (await response.json()) as { secure_url?: string; url?: string; public_id?: string; error?: { message?: string } };
  if (!response.ok || payload.error?.message) {
    throw new Error(payload.error?.message || "Cloudinary upload failed");
  }
  const url = payload.secure_url || payload.url;
  if (!url) {
    throw new Error("Cloudinary did not return a file URL");
  }
  return {
    id: payload.public_id || crypto.randomUUID(),
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.buffer.length,
    url,
    uploadedAt: new Date().toISOString(),
  };
}

export async function storeUpload(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<StoredUpload> {
  const selected = driver();
  if (selected === "s3") {
    return saveS3(file);
  }
  if (selected === "cloudinary") {
    return saveCloudinary(file);
  }
  const stored = await saveLocal(file);
  if (stored.url.startsWith("/")) {
    return stored;
  }
  return { ...stored, url: `${publicApiOrigin()}${stored.url}` };
}
