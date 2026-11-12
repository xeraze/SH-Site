import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { fetchDocumentation, type DocumentationItem } from "../api";
import { renderMiniMarkdown } from "../components/annMarkdown";
import { Lightbox, VideoPreview } from "../components/Announcements";
import { PortalLayout } from "../components/PortalLayout";
import { formatFileSize } from "../utils/chatFiles";
import "./DocumentationPage.css";

function fileIcon(ext: string): string {
  if (ext === "pdf") return "mdi:file-pdf-box";
  if (ext === "doc" || ext === "docx") return "mdi:file-word-outline";
  if (ext === "xls" || ext === "xlsx") return "mdi:file-excel-outline";
  if (ext === "txt") return "mdi:file-text-outline";
  return "mdi:file-outline";
}

function DocFilePreview({ file }: { file: { name: string; url: string; size: number } }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ext = file.name.toLowerCase().split(".").pop() ?? "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onOpen = () => {
    setOpen(true);
    if (ext !== "txt" || text !== null || loading) return;
    setLoading(true);
    fetch(file.url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("bad response"))))
      .then(
        (t) => {
          setText(t.slice(0, 50000));
          setLoading(false);
        },
        () => {
          setText("");
          setLoading(false);
        },
      );
  };

  return (
    <>
      <button type="button" className="docs-file__row" onClick={onOpen}>
        <Icon icon={fileIcon(ext)} width={18} height={18} />
        <span className="docs-file__name">{file.name}</span>
        <span className="docs-file__size">{formatFileSize(file.size)}</span>
        <Icon icon="mdi:magnify-plus-outline" width={16} height={16} />
      </button>
      {open && (
        <div className="docs-preview" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="docs-preview__card" onClick={(e) => e.stopPropagation()}>
            <div className="docs-preview__head">
              <Icon icon={fileIcon(ext)} width={18} height={18} />
              <span className="docs-file__name">{file.name}</span>
              <span className="docs-file__size">{formatFileSize(file.size)}</span>
              <button
                type="button"
                className="docs-preview__close"
                aria-label="Закрити"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="docs-preview__body">
              {ext === "txt" &&
                (loading ? (
                  <p className="docs-empty">Завантаження...</p>
                ) : text === null ? null : text ? (
                  <div className="ann-md docs-text">{renderMiniMarkdown(text)}</div>
                ) : (
                  <p className="docs-empty">Не вдалося прочитати вміст файлу.</p>
                ))}
              {ext === "pdf" && <iframe src={file.url} title={file.name} loading="lazy" />}
              {ext !== "txt" && ext !== "pdf" && (
                <p className="docs-empty">
                  Вбудований перегляд недоступний для цього формату — завантажте
                  файл, щоб переглянути його у своїй програмі.
                </p>
              )}
            </div>
            <a className="docs-file__dl" href={file.url} download={file.name}>
              Завантажити
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export function DocumentationPage() {
  const [items, setItems] = useState<DocumentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    void fetchDocumentation().then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, DocumentationItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [items]);

  const active = items.find((i) => i.id === activeId) ?? null;

  if (loading) {
    return (
      <PortalLayout title="Документація">
        <p className="p-lead">Завантаження...</p>
      </PortalLayout>
    );
  }

  if (active) {
    return (
      <PortalLayout title="Документація">
        <button
          type="button"
          className="docs-back"
          onClick={() => {
            setActiveId(null);
            setLightbox(null);
          }}
        >
          ← До списку документів
        </button>
        <div className="p-block">
          <div className="p-block__head p-block__head--teal">{active.category}</div>
          <div className="p-block__body">
            <h1 className="docs-title">{active.title}</h1>
            {active.summary && <p className="docs-summary">{active.summary}</p>}
            {active.pdfUrl ? (
              <div className="docs-pdf">
                <iframe src={active.pdfUrl} title={active.title} loading="lazy" />
                <a className="docs-pdf__dl" href={active.pdfUrl} download={active.title}>
                  <Icon icon="mdi:download" width={16} height={16} />
                  Завантажити PDF
                </a>
              </div>
            ) : (
              <>
                <div className="ann-md docs-text">{renderMiniMarkdown(active.text)}</div>
                {active.signature && (
                  <img className="docs-sign" src={active.signature} alt="Підпис" />
                )}
              </>
            )}
            <div className="docs-attach">
              {active.images.length > 0 && (
                <div className="ann-card__images">
                  {active.images.map((img, i) => (
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
              {active.videoLinks.map((link, i) => (
                <VideoPreview key={`v${i}`} url={link} />
              ))}
              {active.documents.length > 0 && (
                <div className="docs-files">
                  {active.documents.map((d) => (
                    <DocFilePreview key={d.url} file={d} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {lightbox !== null && active.images.length > 0 && (
          <Lightbox
            images={active.images}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onIndexChange={setLightbox}
          />
        )}
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title="Документація">
      <p className="p-lead">
        Нормативні документи, положення та інструкції лікарні, зібрані за
        категоріями.
      </p>

      {items.length === 0 ? (
        <div className="p-block">
          <div className="p-block__head">Документи</div>
          <div className="p-block__body">
            <p className="docs-empty">Документи поки не додано.</p>
          </div>
        </div>
      ) : (
        grouped.map(([category, list]) => (
          <div className="p-block" key={category}>
            <div className="p-block__head p-block__head--teal">{category}</div>
            <ul className="docs-list">
              {list.map((item) => (
                <li key={item.id} className="docs-list__item">
                  <button
                    type="button"
                    className="docs-list__btn"
                    onClick={() => setActiveId(item.id)}
                  >
                    <span className="docs-list__title">
                      {item.title}
                      {item.summary && (
                        <span className="docs-list__summary">{item.summary}</span>
                      )}
                    </span>
                    <span className="docs-list__date">
                      {item.updatedAt ?? item.createdAt}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </PortalLayout>
  );
}
