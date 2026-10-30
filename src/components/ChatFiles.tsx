import { Icon } from "@iconify/react";

export const DOC_EXT = ["pdf", "txt", "doc", "docx"];
export const MAX_DOC_BYTES = 20 * 1024 * 1024;
export const DOCS_MAX = 5;

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${bytes} Б`;
}

function docIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "mdi:file-pdf-box";
  if (ext === "doc" || ext === "docx") return "mdi:file-word-outline";
  return "mdi:file-document-outline";
}

export function ChatDocCard({
  name,
  url,
  size,
}: {
  name: string;
  url: string;
  size: number;
}) {
  return (
    <a className="chat-doc" href={url} target="_blank" rel="noreferrer" download={name}>
      <Icon icon={docIcon(name)} className="chat-doc__icon" />
      <span className="chat-doc__info">
        <span className="chat-doc__name">{name}</span>
        <span className="chat-doc__size">{formatFileSize(size)}</span>
      </span>
    </a>
  );
}

const DOC_MIME: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const IMG_MAX_CHARS = 1_500_000;

export function readFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function compressImageForChat(file: File): Promise<string> {
  const dataUrl = await readFileDataUrl(file);
  if (dataUrl.length <= IMG_MAX_CHARS) return dataUrl;

  const img = new Image();
  const src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Зображення не читається"));
    img.src = src;
  });

  let scale = 1;
  let out = src;
  let quality = 0.8;
  while (out.length > IMG_MAX_CHARS && (scale > 0.3 || quality > 0.4)) {
    if (quality > 0.4) {
      quality -= 0.1;
    } else {
      scale -= 0.15;
      quality = 0.7;
    }
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(img, 0, 0, w, h);
    out = canvas.toDataURL("image/jpeg", quality);
  }
  if (out.length > IMG_MAX_CHARS) {
    throw new Error("Зображення завелике");
  }
  return out;
}

export function readDocDataUrl(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!DOC_EXT.includes(ext)) {
    return Promise.reject(new Error("Документ має бути PDF, TXT, DOC або DOCX"));
  }
  if (file.size > MAX_DOC_BYTES) {
    return Promise.reject(new Error("Документ завеликий (до 20 МБ)"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати документ"));
    reader.onload = () => {
      const raw = String(reader.result);
      const comma = raw.indexOf(",");
      if (comma < 0) {
        reject(new Error("Некоректний документ"));
        return;
      }
      const head = raw.slice(0, comma);
      const mime = head.slice(5, head.indexOf(";")) || "application/octet-stream";
      const expected = DOC_MIME[ext];
      if (mime === expected || mime === "application/octet-stream") {
        resolve(`data:${expected};base64,${raw.slice(comma + 1)}`);
      } else {
        resolve(raw);
      }
    };
    reader.readAsDataURL(file);
  });
}
