const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export interface ExtractedCommentImage {
  id: string;
  name: string;
  mimeType: string;
  data: Buffer;
}

export function stripHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isEmptyHtml(value: string): boolean {
  return !stripHtml(value) && !/<img\b/i.test(value) && !/data-type="comment-attachment"/i.test(value);
}

export function extractMentionIds(html: string): string[] {
  const ids = [...html.matchAll(/\bdata-id="([^"]+)"/gi)].map((match) => match[1]?.trim() ?? "").filter(Boolean);
  return [...new Set(ids)];
}

function attr(tag: string, name: string): string {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"))?.[1]?.trim() ?? "";
}

export function extractAttachmentCards(html: string): Array<{
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}> {
  const cards: Array<{ id: string; name: string; mimeType: string; size: number; url: string }> = [];
  for (const match of html.matchAll(/<div\b[^>]*data-type="comment-attachment"[^>]*>/gi)) {
    const tag = match[0] ?? "";
    const url = attr(tag, "data-src") || attr(tag, "href");
    if (!url || url.startsWith("data:")) {
      continue;
    }
    cards.push({
      id: attr(tag, "data-file-id") || crypto.randomUUID(),
      name: attr(tag, "data-name") || "attachment",
      mimeType: attr(tag, "data-mime") || "application/octet-stream",
      size: Number(attr(tag, "data-size")) || 0,
      url,
    });
  }
  return cards;
}

export function extractDataImages(html: string): { html: string; images: ExtractedCommentImage[] } {
  const images: ExtractedCommentImage[] = [];
  const next = html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    const src = attrs.match(/\bsrc="([^"]+)"/i)?.[1];
    if (!src?.startsWith("data:")) {
      return full;
    }
    const parsed = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!parsed?.[1] || !parsed[2] || !IMAGE_TYPES.has(parsed[1])) {
      return "";
    }
    const data = Buffer.from(parsed[2], "base64");
    if (!data.length) {
      return "";
    }
    const id = crypto.randomUUID();
    const mimeType = parsed[1];
    const extension = mimeType.split("/")[1] ?? "png";
    images.push({ id, name: `comment-image.${extension}`, mimeType, data });
    const cleanedAttrs = attrs.replace(/\bsrc="[^"]+"/i, `src="__COMMENT_IMG_${id}__"`);
    return `<img${cleanedAttrs}>`;
  });
  return { html: next, images };
}

export function applyImageUrls(html: string, taskId: string, commentId: string, imageIds: string[]): string {
  return imageIds.reduce((current, imageId) => {
    const url = `/api/tasks/${taskId}/comments/${commentId}/attachments/${imageId}`;
    return current.replaceAll(`__COMMENT_IMG_${imageId}__`, url);
  }, html);
}

export function sanitizeCommentHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}
