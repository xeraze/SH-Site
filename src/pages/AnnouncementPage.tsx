import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  announcementLink,
  copyText,
  fetchAnnouncement,
  toggleAnnouncementLike,
  type PublicAnnouncement,
} from "../api";
import { AnnouncementBody } from "../components/AnnouncementBody";
import { Link } from "../components/AppLink";
import { Lightbox, VideoPreview } from "../components/Announcements";
import { PortalLayout } from "../components/PortalLayout";
import "../components/Announcements.css";

export function AnnouncementPage() {
  const { annId } = useParams();
  const [item, setItem] = useState<PublicAnnouncement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (!annId) return;
    const url = announcementLink(annId);
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({
          title: item?.title ?? item?.summary ?? "Оголошення",
          url,
        });
        return;
      } catch {
        // користувач закрив або share недоступний — копіюємо
      }
    }
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const load = useCallback(async () => {
    if (!annId) return;
    const res = await fetchAnnouncement(annId);
    if (res.ok) setItem(res.announcement);
    else setError(res.error);
    setLoading(false);
  }, [annId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onLike = async () => {
    if (!item) return;
    const res = await toggleAnnouncementLike(item.id);
    if (res.ok) setItem({ ...item, liked: res.liked, likes: res.likes });
  };

  const date = item
    ? new Date(item.createdAt.endsWith("Z") ? item.createdAt : item.createdAt + "Z")
    : null;

  return (
    <PortalLayout title="Оголошення">
      {loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : error || !item ? (
        <div className="p-block">
          <div className="p-block__head">Оголошення</div>
          <div className="p-block__body">
            <p className="ann-empty">{error ?? "Оголошення не знайдено"}</p>
            <Link to="/oholoshennya" className="portal-cta">
              До списку оголошень
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-block">
          <div className="p-block__head">Оголошення</div>
          <div className="p-block__body">
            <article className="ann-card ann-card--full ann-detail">
              <div className="ann-card__head">
                <span className={`ann-card__badge ann-card__badge--${item.type}`}>
                  {item.type === "short" ? "Коротке" : "Звичайне"}
                </span>
                <time className="ann-card__date">
                  {date ? date.toLocaleDateString("uk-UA") : ""}
                </time>
              </div>
              <h3 className="ann-detail__title">
                {item.title || item.summary || item.text.slice(0, 60)}
              </h3>
              {item.visibility === "ads" && item.bannerImage && (
                <div className="ann-card__banner">
                  <img src={item.bannerImage} alt="" />
                </div>
              )}
              {item.visibility === "ads" && item.bannerVideo && (
                <VideoPreview url={item.bannerVideo} />
              )}
              <AnnouncementBody text={item.text} />
              {item.images.length > 0 && (
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
              {item.videoLinks.map((link, i) => (
                <VideoPreview key={`v${i}`} url={link} />
              ))}
              {item.tags.length > 0 && (
                <div className="ann-card__tags">
                  {item.tags.map((t) => (
                    <span key={t} className="ann-tag">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="ann-card__foot">
                <button
                  type="button"
                  className={`ann-like${item.liked ? " ann-like--on" : ""}`}
                  disabled={item.category === "old" || item.category === "archive"}
                  onClick={() => void onLike()}
                  title="Подобається"
                >
                  ♥ {item.likes}
                </button>
                <button
                  type="button"
                  className="ann-detail__share"
                  onClick={() => void onShare()}
                >
                  {copied ? "Посилання скопійовано" : "Поділитися"}
                </button>
                <Link to="/oholoshennya" className="ann-detail__back">
                  ← До списку оголошень
                </Link>
              </div>
            </article>
          </div>
        </div>
      )}
      {lightbox !== null && item && item.images.length > 0 && (
        <Lightbox
          images={item.images}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndexChange={setLightbox}
        />
      )}
    </PortalLayout>
  );
}
