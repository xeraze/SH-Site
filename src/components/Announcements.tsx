import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { AnnouncementBody } from "./AnnouncementBody";
import { ChatDocCard } from "./ChatFiles";
import { Link } from "./AppLink";
import type { PublicAnnouncement } from "../api";
import "./Announcements.css";

export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(Math.min(index + 1, images.length - 1));
      if (e.key === "ArrowLeft") onIndexChange(Math.max(index - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onIndexChange]);

  return (
    <div className="ann-lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="ann-lightbox__close" aria-label="Закрити">
        ×
      </button>
      <img src={images[index]} alt="" onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && (
        <div className="ann-lightbox__nav" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onIndexChange(index - 1)}
          >
            ‹
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            disabled={index === images.length - 1}
            onClick={() => onIndexChange(index + 1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export function VideoPreview({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return (
      <a className="ann-video ann-video--link" href={url} target="_blank" rel="noreferrer">
        {url}
      </a>
    );
  }
  if (playing) {
    return (
      <div className="ann-video ann-video--frame">
        <iframe
          src={parsed.embed}
          title="Відео"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="ann-video">
      {parsed.thumb && (
        <button
          type="button"
          className="ann-video__thumb"
          onClick={() => setPlaying(true)}
          aria-label="Відтворити відео"
        >
          <img src={parsed.thumb} alt="" />
          <span className="ann-video__play">
            <Icon icon="mdi:play-circle" width={48} height={48} />
          </span>
        </button>
      )}
      <a className="ann-video__link" href={url} target="_blank" rel="noreferrer">
        {parsed.provider}: {parsed.label}
      </a>
    </div>
  );
}

function parseVideoUrl(
  raw: string,
): { provider: string; embed: string; thumb?: string; label: string } | null {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return {
        provider: "YouTube",
        embed: `https://www.youtube-nocookie.com/embed/${id}`,
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        label: id,
      };
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const id =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:shorts|embed)\/([^/?#]+)/)?.[1];
      if (!id) return null;
      return {
        provider: "YouTube",
        embed: `https://www.youtube-nocookie.com/embed/${id}`,
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        label: id,
      };
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const m = url.pathname.match(/\/video\/(\d+)/);
      if (!m) return null;
      return {
        provider: "TikTok",
        embed: `https://www.tiktok.com/embed/v2/${m[1]}`,
        label: m[1],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function AnnouncementCard({
  item,
  onLike,
  likedLocked,
  extra,
  full,
}: {
  item: PublicAnnouncement;
  onLike?: (id: string) => void;
  likedLocked?: boolean;
  extra?: React.ReactNode;
  full?: boolean;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.createdAt.endsWith("Z") ? item.createdAt : item.createdAt + "Z");
  const likesAllowed = item.category !== "old" && item.category !== "archive";
  const isShort = item.type === "short";
  const summary = item.summary ?? item.text;
  const hasBody = !isShort && item.text.trim().length > 0 && item.text !== summary;
  const hasExtraContent =
    item.images.length > 0 ||
    item.videoLinks.length > 0 ||
    item.tags.length > 0 ||
    (item.documents?.length ?? 0) > 0;
  const hasMore = full && !isShort && (hasBody || hasExtraContent);
  const detail = `/oholoshennya/${item.id}`;

  return (
    <li className={`ann-card ann-card--${item.type}${full ? " ann-card--full" : ""}`}>
      <div className="ann-card__head">
        <span className={`ann-card__badge ann-card__badge--${item.type}`}>
          {isShort ? "Коротке" : "Звичайне"}
        </span>
        {item.category === "old" && <span className="ann-card__cat">Старе</span>}
        <time className="ann-card__date">{date.toLocaleDateString("uk-UA")}</time>
      </div>
      <div className="ann-card__title">
        {full || isShort ? (
          item.title || summary.slice(0, 60)
        ) : (
          <Link to={detail}>{item.title || summary.slice(0, 60)}</Link>
        )}
      </div>
      {item.visibility === "ads" && item.bannerImage && !full && (
        <div className="ann-card__banner">
          <img src={item.bannerImage} alt="" />
        </div>
      )}
      {item.visibility === "ads" && item.bannerVideo && !full && (
        <VideoPreview url={item.bannerVideo} />
      )}
      {isShort ? (
        <AnnouncementBody text={item.text} short />
      ) : (
        <p className="ann-card__summary">{summary}</p>
      )}
      {hasMore && (
        <button
          type="button"
          className="ann-card__more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Згорнути" : "Читати далі"}
        </button>
      )}
      {!full && !isShort && (
        <Link className="ann-card__more ann-card__more--link" to={detail}>
          Читати далі
        </Link>
      )}
      {expanded && hasBody && <AnnouncementBody text={item.text} />}
      {expanded && item.images.length > 0 && (
        <div className="ann-card__images">
          {item.images.map((img, i) => (
            <button
              type="button"
              key={i}
              className="ann-card__thumb"
              onClick={() => setLightbox(i)}
            >
              <img src={img} alt={`Зображення ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
      {expanded &&
        item.videoLinks.map((link, i) => <VideoPreview key={`v${i}`} url={link} />)}
      {expanded && (item.documents?.length ?? 0) > 0 && (
        <div className="ann-card__docs">
          {item.documents.map((d) => (
            <ChatDocCard key={d.url} name={d.name} url={d.url} size={d.size} />
          ))}
        </div>
      )}
      {expanded && item.tags.length > 0 && (
        <div className="ann-card__tags">
          {item.tags.map((t) => (
            <span key={t} className="ann-tag">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="ann-card__foot">
        {onLike && (
          <button
            type="button"
            className={`ann-like${item.liked ? " ann-like--on" : ""}`}
            disabled={!likesAllowed || likedLocked}
            onClick={() => onLike(item.id)}
            title={
              !likesAllowed
                ? "Лайки доступні лише для свіжих оголошень"
                : likedLocked
                  ? "Увійдіть, щоб вподобати"
                  : "Подобається"
            }
          >
            <Icon icon="mdi:heart" width={15} height={15} /> {item.likes}
          </button>
        )}
        {extra}
      </div>
      {lightbox !== null && item.images.length > 0 && (
        <Lightbox
          images={item.images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </li>
  );
}
