import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { getToken } from "../api";
import { formatFileSize } from "../utils/chatFiles";

function needsAuth(url: string): boolean {
  return url.includes("/api/files/msg/");
}

function useFileUrl(url: string): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!needsAuth(url)) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const token = getToken();
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return needsAuth(url) ? blobUrl : url;
}

export function ChatImage({ url }: { url: string }) {
  const src = useFileUrl(url);
  if (!src) return null;
  return <img src={src} alt="" className="cabinet-chat__img" />;
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
  const href = useFileUrl(url) ?? undefined;
  return (
    <a className="chat-doc" href={href} target="_blank" rel="noreferrer" download={name}>
      <Icon icon={docIcon(name)} className="chat-doc__icon" />
      <span className="chat-doc__info">
        <span className="chat-doc__name">{name}</span>
        <span className="chat-doc__size">{formatFileSize(size)}</span>
      </span>
    </a>
  );
}

