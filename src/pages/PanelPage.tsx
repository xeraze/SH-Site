import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminSetBan,
  announcementLink,
  assignRole,
  copyText,
  deleteAnnouncement,
  deleteInvite,
  fetchAdminUsers,
  fetchAnnouncementsManage,
  fetchApplicationsReview,
  fetchAppointmentsQueue,
  fetchInvites,
  fetchMessages,
  fetchMe,
  saveAnnouncement,
  sendMessage,
  setApplicationStatus,
  setAppointmentStatus,
  type AnnouncementItem,
  type AdminUserItem,
  type ApplicationItem,
  type AppointmentItem,
  type DialogueMessage,
  type InviteItem,
  type PublicUser,
} from "../api";
import { PortalLayout } from "../components/PortalLayout";
import {
  ROLE_LABELS_UI,
  REVIEWER_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  APPOINTMENT_REVIEW_ROLES_UI,
  hasAnyRole,
} from "../data/roles";
import "./CabinetPage.css";

const APPOINTMENT_STATUS_LABELS_UI: Record<string, string> = {
  new: "Нова",
  in_progress: "У роботі",
  accepted: "Прийнята",
  rejected: "Відхилена",
};

type PanelTab = "appeals" | "jobs" | "callcenter" | "constructor" | "roles" | "users";

function ReviewChat({
  app,
  onChanged,
}: {
  app: ApplicationItem;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchMessages(app.id);
    setMessages(res.messages);
  }, [app.id]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await sendMessage(app.id, text.trim());
    setSending(false);
    if (res.ok) {
      setText("");
      void load();
      onChanged();
    }
  };

  return (
    <>
      <button
        type="button"
        className="cabinet-action cabinet-action--dialogue"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Закрити діалог" : "Діалог"}
      </button>
      {open && (
        <div className="cabinet-chat cabinet-chat--wide">
          {messages.length === 0 ? (
            <p className="cabinet-chat__empty">Повідомлень ще немає.</p>
          ) : (
            <ul className="cabinet-chat__list">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`cabinet-chat__msg${m.isReviewer ? " cabinet-chat__msg--staff" : ""}`}
                >
                  <span className="cabinet-chat__who">{m.senderName}</span>
                  <p>{m.body}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={onSend} className="cabinet-chat__form">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Відповісти пацієнту..."
              maxLength={4000}
            />
            <button type="submit" className="portal-cta" disabled={sending}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ReviewPanel({ kind }: { kind: "appeals" | "jobs" }) {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "done">("new");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchApplicationsReview());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const forKind = items.filter((a) =>
    kind === "jobs" ? a.formId === "job_application" : a.formId !== "job_application",
  );

  const filtered = forKind.filter((a) => {
    if (tab === "new") return a.status === "new";
    if (tab === "active") return a.status === "reviewing" || a.status === "dialogue";
    return a.status === "accepted" || a.status === "rejected";
  });

  const onStatus = async (id: string, status: string, needNote = false) => {
    let note: string | undefined;
    if (needNote) {
      note = window.prompt("Причина / коментар (необов'язково):") ?? undefined;
      if (note === null) return;
    }
    setMsg(null);
    const res = await setApplicationStatus(id, status, note);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    void load();
  };

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">
        {kind === "jobs" ? "Заявки на посаду" : "Звернення"}
      </div>
      <div className="p-block__body">
        <div className="cabinet-tabs">
          <button
            type="button"
            className={`cabinet-tab${tab === "new" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("new")}
          >
            Нові
          </button>
          <button
            type="button"
            className={`cabinet-tab${tab === "active" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("active")}
          >
            На розгляді
          </button>
          <button
            type="button"
            className={`cabinet-tab${tab === "done" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("done")}
          >
            Архів
          </button>
        </div>
        {msg && <p className="cabinet-profile-error">{msg}</p>}
        {filtered.length === 0 ? (
          <p className="cabinet-profile-note">Порожньо.</p>
        ) : (
          <ul className="cabinet-apps">
            {filtered.map((app) => (
              <li key={app.id} className="cabinet-apps__item">
                <div className="cabinet-apps__head">
                  <strong>{app.formTitle}</strong>
                  <span className={`cabinet-apps__status cabinet-apps__status--${app.status}`}>
                    {app.statusLabel}
                  </span>
                </div>
                {app.author && (
                  <div className="cabinet-apps__date">
                    {app.author.name} · {app.author.email ?? "—"} ·{" "}
                    {new Date(app.createdAt + "Z").toLocaleString("uk-UA")}
                  </div>
                )}
                <ul className="cabinet-review-answers">
                  {app.answers.map((a, i) => (
                    <li key={i}>
                      <strong>{a.label}:</strong> {a.value}
                    </li>
                  ))}
                </ul>
                {app.decisionNote && (
                  <div className="cabinet-apps__note">{app.decisionNote}</div>
                )}
                <div className="cabinet-review-actions">
                  {app.status === "new" && (
                    <button
                      type="button"
                      className="cabinet-action cabinet-action--review"
                      onClick={() => void onStatus(app.id, "reviewing")}
                    >
                      Розглядати
                    </button>
                  )}
                  {(app.status === "reviewing" || app.status === "dialogue") && (
                    <>
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--ok"
                        onClick={() => void onStatus(app.id, "accepted", true)}
                      >
                        Прийняти
                      </button>
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--no"
                        onClick={() => void onStatus(app.id, "rejected", true)}
                      >
                        Відхилити
                      </button>
                    </>
                  )}
                  {app.status !== "accepted" && app.status !== "rejected" && (
                    <ReviewChat app={app} onChanged={() => void load()} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AppointmentsQueue() {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "done">("new");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchAppointmentsQueue());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = items.filter((a) => {
    if (tab === "new") return a.status === "new";
    if (tab === "active") return a.status === "in_progress";
    return a.status === "accepted" || a.status === "rejected";
  });

  const onStatus = async (id: string, status: string, needNote = false) => {
    let note: string | undefined;
    if (needNote) {
      note = window.prompt("Коментар для пацієнта (необов'язково):") ?? undefined;
      if (note === null) return;
    }
    setMsg(null);
    const res = await setAppointmentStatus(id, status, note);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    void load();
  };

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Кол-центр: записи на прийом</div>
      <div className="p-block__body">
        <div className="cabinet-tabs">
          <button
            type="button"
            className={`cabinet-tab${tab === "new" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("new")}
          >
            Нові
          </button>
          <button
            type="button"
            className={`cabinet-tab${tab === "active" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("active")}
          >
            У роботі
          </button>
          <button
            type="button"
            className={`cabinet-tab${tab === "done" ? " cabinet-tab--on" : ""}`}
            onClick={() => setTab("done")}
          >
            Вирішені
          </button>
        </div>
        {msg && <p className="cabinet-profile-error">{msg}</p>}
        {filtered.length === 0 ? (
          <p className="cabinet-profile-note">Порожньо.</p>
        ) : (
          <ul className="cabinet-apps">
            {filtered.map((a) => (
              <li key={a.id} className="cabinet-apps__item">
                <div className="cabinet-apps__head">
                  <strong>Запис на прийом</strong>
                  <span className={`cabinet-apps__status cabinet-apps__status--${a.status}`}>
                    {APPOINTMENT_STATUS_LABELS_UI[a.status] ?? a.statusLabel}
                  </span>
                </div>
                {a.author && (
                  <div className="cabinet-apps__date">
                    {a.author.name} · {a.author.email ?? "—"} ·{" "}
                    {new Date(a.createdAt + "Z").toLocaleString("uk-UA")}
                  </div>
                )}
                <div className="cabinet-apps__date">Бажана дата: {a.wantDate}</div>
                <div className="cabinet-review-answers">
                  <p>{a.body}</p>
                </div>
                {a.decisionNote && (
                  <div className="cabinet-apps__note">{a.decisionNote}</div>
                )}
                <div className="cabinet-review-actions">
                  {a.status === "new" && (
                    <button
                      type="button"
                      className="cabinet-action cabinet-action--review"
                      onClick={() => void onStatus(a.id, "in_progress")}
                    >
                      Взяти в роботу
                    </button>
                  )}
                  {a.status === "in_progress" && (
                    <>
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--ok"
                        onClick={() => void onStatus(a.id, "accepted", true)}
                      >
                        Прийняти
                      </button>
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--no"
                        onClick={() => void onStatus(a.id, "rejected", true)}
                      >
                        Відхилити
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RolesPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [assignable, setAssignable] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchInvites();
    setInvites(res.invites);
    setAssignable(res.assignable);
    setRole((prev) => (prev && res.assignable.includes(prev) ? prev : res.assignable[0] ?? ""));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setInviteLink(null);
    const res = await assignRole(email.trim(), role);
    setSaving(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    if (res.assigned) {
      setMsg(`Роль «${ROLE_LABELS_UI[role] ?? role}» надано користувачу ${email}.`);
      setEmail("");
    } else {
      setMsg(
        res.emailed
          ? "Користувача не знайдено на сайті. Запрошення надіслано на пошту."
          : "Користувача не знайдено. Скопіюйте посилання-запрошення і надішліть самі.",
      );
      setInviteLink(res.link ?? null);
      setEmail("");
    }
    void load();
  };

  const onCopy = (link: string) => {
    void navigator.clipboard.writeText(link);
    setMsg("Посилання скопійовано.");
  };

  const onDelete = async (token: string) => {
    await deleteInvite(token);
    void load();
  };

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Призначення посад</div>
      <div className="p-block__body">
        <p className="cabinet-profile-note">
          Посади, які ви можете призначати. Якщо користувач вже зареєстрований —
          роль надається одразу, інакше створюється запрошення (лист або
          посилання). Призначення однієї з трьох директорських посад знімає
          попередню.
        </p>
        <form onSubmit={onSubmit} className="cabinet-roles-form">
          <label className="apps-field">
            <span className="apps-field__label">Email користувача</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">Посада</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              {assignable.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS_UI[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="portal-cta" disabled={saving || !role}>
            {saving ? "..." : "Призначити"}
          </button>
        </form>
        {msg && <p className="cabinet-profile-note">{msg}</p>}
        {inviteLink && (
          <div className="cabinet-invite-link">
            <code>{inviteLink}</code>
            <button
              type="button"
              className="cabinet-logout"
              onClick={() => onCopy(inviteLink)}
            >
              Копіювати
            </button>
          </div>
        )}
        {invites.length > 0 && (
          <>
            <p className="cabinet-profile-note" style={{ marginTop: "1rem" }}>
              Активні запрошення:
            </p>
            <ul className="cabinet-apps">
              {invites.map((inv) => (
                <li key={inv.token} className="cabinet-apps__item">
                  <div className="cabinet-apps__head">
                    <strong>{inv.roleLabel}</strong>
                    <button
                      type="button"
                      className="cabinet-logout"
                      onClick={() => void onDelete(inv.token)}
                    >
                      Скасувати
                    </button>
                  </div>
                  <div className="cabinet-apps__date">{inv.email ?? "—"}</div>
                  <button
                    type="button"
                    className="cabinet-logout"
                    onClick={() => onCopy(inv.link)}
                  >
                    Копіювати посилання
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

const SUMMARY_MAX = 300;
const REGULAR_DESC_MAX = 3000;
const REGULAR_TITLE_MAX = 150;
const ATTACHMENTS_MAX = 5;
const TAGS_MAX = 10;
const TAG_LEN_MAX = 32;
const VISIBILITIES = [
  { value: "general", label: "Усі (гості та користувачі)" },
  { value: "hospital", label: "Тільки після входу" },
  { value: "staff", label: "Тільки персонал" },
  { value: "ads", label: "Реклама (баннер/відео)" },
] as const;

function resizeAnnouncementImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Некоректне зображення"));
      img.onload = () => {
        if (img.type === "image/gif") {
          const raw = String(reader.result);
          if (raw.length > 160_000) {
            reject(new Error("GIF завеликий (до 150 КБ)"));
            return;
          }
          resolve(raw);
          return;
        }
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas недоступний"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.75;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > 150_000 && quality > 0.4) {
          quality -= 0.1;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        if (out.length > 160_000) {
          reject(new Error("Зображення завелике"));
          return;
        }
        resolve(out);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function isVideoUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) {
      return true;
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return true;
    return false;
  } catch {
    return false;
  }
}

function AnnouncementsManage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [type, setType] = useState<"short" | "regular">("short");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<string>("general");
  const [images, setImages] = useState<string[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerVideo, setBannerVideo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setItems(await fetchAnnouncementsManage());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const wrapSelection = (before: string, after = before) => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    const next = text.slice(0, start) + before + selected + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  };

  const insertHeading = () => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const next = text.slice(0, lineStart) + "## " + text.slice(lineStart);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart + 3, lineStart + 3);
    });
  };

  const onAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setMsg(null);
    for (const file of files) {
      if (images.length + videoLinks.length >= ATTACHMENTS_MAX) {
        setMsg(`Максимум ${ATTACHMENTS_MAX} вкладень сумарно`);
        break;
      }
      try {
        const dataUrl = await resizeAnnouncementImage(file);
        setImages((prev) =>
          prev.length + videoLinks.length < ATTACHMENTS_MAX ? [...prev, dataUrl] : prev,
        );
      } catch (err) {
        setMsg(err instanceof Error ? err.message : "Не вдалося обробити зображення");
      }
    }
  };

  const onAddBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    try {
      const dataUrl = await resizeAnnouncementImage(file);
      setBannerImage(dataUrl);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Не вдалося обробити баннер");
    }
  };

  const onAddVideo = () => {
    const value = videoInput.trim();
    if (!value) return;
    if (!isVideoUrl(value)) {
      setMsg("Посилання має бути на YouTube або TikTok");
      return;
    }
    if (images.length + videoLinks.length >= ATTACHMENTS_MAX) {
      setMsg(`Максимум ${ATTACHMENTS_MAX} вкладень сумарно`);
      return;
    }
    setVideoLinks((prev) => [...prev, value]);
    setVideoInput("");
    setMsg(null);
  };

  const parseTags = (raw: string): string[] =>
    raw
      .split(",")
      .map((t) => t.trim().slice(0, TAG_LEN_MAX))
      .filter(Boolean)
      .slice(0, TAGS_MAX);

  const resetForm = () => {
    setEditingId(null);
    setType("short");
    setTitle("");
    setSummary("");
    setText("");
    setTags("");
    setVisibility("general");
    setImages([]);
    setVideoLinks([]);
    setVideoInput("");
    setBannerImage(null);
    setBannerVideo("");
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (visibility === "ads" && !bannerImage && !bannerVideo.trim()) {
      setMsg("Для реклами потрібен баннер або відео-посилання");
      return;
    }
    if (bannerVideo.trim() && !isVideoUrl(bannerVideo.trim())) {
      setMsg("Відео-посилання має бути на YouTube або TikTok");
      return;
    }
    if (images.length + videoLinks.length > ATTACHMENTS_MAX) {
      setMsg(`Максимум ${ATTACHMENTS_MAX} вкладень сумарно`);
      return;
    }
    setSaving(true);
    const res = await saveAnnouncement({
      type,
      title: type === "regular" ? title : undefined,
      summary: type === "regular" ? summary : undefined,
      text,
      tags: type === "regular" ? parseTags(tags) : [],
      visibility: type === "regular" ? visibility : "general",
      images: type === "regular" ? images : [],
      videoLinks: type === "regular" ? videoLinks : [],
      bannerImage:
        type === "regular" && visibility === "ads" && bannerImage ? bannerImage : undefined,
      bannerVideo:
        type === "regular" && visibility === "ads" && bannerVideo.trim()
          ? bannerVideo.trim()
          : undefined,
      id: editingId ?? undefined,
    });
    setSaving(false);
    if (!res.ok) {
      let errText = res.error;
      if (res.freeAt) {
        const t = new Date(res.freeAt.endsWith("Z") ? res.freeAt : res.freeAt + "Z");
        errText += ` Перше оголошення зникне ${t.toLocaleString("uk-UA")}.`;
      }
      setMsg(errText);
      return;
    }
    resetForm();
    setMsg("Збережено");
    void load();
  };

  const onDelete = async (id: string) => {
    setMsg(null);
    if (!window.confirm("Видалити оголошення? Цю дію не можна скасувати.")) return;
    const res = await deleteAnnouncement(id);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    void load();
  };

  const onCopyLink = async (id: string) => {
    if (await copyText(announcementLink(id))) {
      setMsg("Посилання скопійовано");
    } else {
      setMsg("Не вдалося скопіювати посилання");
    }
  };

  const onToggle = async (item: AnnouncementItem) => {
    await saveAnnouncement({
      type: item.type,
      title: item.title ?? undefined,
      summary: item.summary ?? undefined,
      text: item.text,
      tags: item.tags,
      visibility: item.visibility,
      images: item.images,
      videoLinks: item.videoLinks,
      bannerImage: item.bannerImage ?? undefined,
      bannerVideo: item.bannerVideo ?? undefined,
      id: item.id,
      active: item.active !== 1,
    });
    void load();
  };

  const onEdit = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title ?? "");
    setSummary(item.summary ?? "");
    setText(item.text);
    setTags(item.tags.join(", "));
    setVisibility(item.visibility);
    setImages(item.images);
    setVideoLinks(item.videoLinks);
    setVideoInput("");
    setBannerImage(item.bannerImage);
    setBannerVideo(item.bannerVideo ?? "");
    setMsg(null);
  };

  const shortFull = type === "short" && text.length >= 80;
  const descFull = type === "regular" && text.length >= REGULAR_DESC_MAX;
  const attachments = images.length + videoLinks.length;

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Конструктор оголошень</div>
      <div className="p-block__body">
        <p className="cabinet-profile-note">
          <strong>Коротке</strong> — до 80 символів, тікер, 7 днів, ліміт 5.
          <strong> Звичайне</strong> — заголовок (до {REGULAR_TITLE_MAX}), короткий
          опис (до {SUMMARY_MAX}), текст (до {REGULAR_DESC_MAX}), теги, видимість,
          до {ATTACHMENTS_MAX} вкладень (зображення/GIF/відео-посилання).
          Реклама: баннер або відео.
        </p>
        <form onSubmit={onSave} className="cabinet-ann-form">
          <div className="cabinet-ann-types">
            <label
              className={
                type === "short" ? "cabinet-ann-type cabinet-ann-type--on" : "cabinet-ann-type"
              }
            >
              <input
                type="radio"
                name="ann-type"
                checked={type === "short"}
                onChange={() => setType("short")}
              />
              <strong>Коротке</strong>
              <span>тикер, 7 днів, без форматування</span>
            </label>
            <label
              className={
                type === "regular"
                  ? "cabinet-ann-type cabinet-ann-type--on"
                  : "cabinet-ann-type"
              }
            >
              <input
                type="radio"
                name="ann-type"
                checked={type === "regular"}
                onChange={() => setType("regular")}
              />
              <strong>Звичайне</strong>
              <span>заголовок, опис, теги, вкладення</span>
            </label>
          </div>

          {type === "regular" && (
            <label className="apps-field">
              <span className="apps-field__label">Заголовок (без форматування)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={REGULAR_TITLE_MAX}
                placeholder="Заголовок оголошення"
                required
              />
            </label>
          )}

          {type === "regular" && (
            <label className="apps-field">
              <span className="apps-field__label">Короткий опис (для картки)</span>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={SUMMARY_MAX}
                placeholder="Одне-два речення для стрічки"
                required
              />
            </label>
          )}

          {type === "regular" && (
            <div className="cabinet-ann-toolbar" role="toolbar" aria-label="Форматування">
              <button type="button" onClick={() => wrapSelection("**")} title="Жирний">
                <b>B</b>
              </button>
              <button type="button" onClick={() => wrapSelection("*")} title="Курсив">
                <i>I</i>
              </button>
              <button type="button" onClick={() => wrapSelection("__")} title="Підкреслення">
                <u>U</u>
              </button>
              <button type="button" onClick={insertHeading} title="Заголовок">
                H
              </button>
            </div>
          )}

          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              type === "short"
                ? "Коротке оголошення (до 80 символів)..."
                : "Текст оголошення..."
            }
            maxLength={type === "short" ? 80 : REGULAR_DESC_MAX}
            rows={type === "short" ? 2 : 7}
            required
          />
          <div className="cabinet-ann-count">
            {type === "short" ? `${text.length}/80` : `${text.length}/${REGULAR_DESC_MAX}`}
          </div>

          {type === "regular" && (
            <label className="apps-field">
              <span className="apps-field__label">
                Теги (через кому, до {TAGS_MAX})
              </span>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="наприклад: кардіологія, консультація"
              />
            </label>
          )}

          {type === "regular" && (
            <label className="apps-field">
              <span className="apps-field__label">Видимість</span>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                {VISIBILITIES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {type === "regular" && (
            <div className="cabinet-ann-images">
              <label className="cabinet-avatar-upload">
                Додати зображення ({attachments}/{ATTACHMENTS_MAX})
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => void onAddImage(e)}
                  hidden
                  disabled={attachments >= ATTACHMENTS_MAX}
                />
              </label>
              {images.map((img, i) => (
                <span key={i} className="cabinet-ann-img">
                  <img src={img} alt={`Зображення ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Прибрати"
                  >
                    ×
                  </button>
                </span>
              ))}
              {videoLinks.map((link, i) => (
                <span key={`v${i}`} className="cabinet-ann-img">
                  <span className="cabinet-ann-video">
                    {link.includes("tiktok") ? "TikTok" : "YouTube"}:{" "}
                    {new URL(link).hostname.replace(/^www\./, "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoLinks((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Прибрати"
                  >
                    ×
                  </button>
                </span>
              ))}
              {attachments < ATTACHMENTS_MAX && (
                <span className="cabinet-ann-video-add">
                  <input
                    type="url"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <button type="button" className="cabinet-logout" onClick={onAddVideo}>
                    Додати відео
                  </button>
                </span>
              )}
            </div>
          )}

          {type === "regular" && visibility === "ads" && (
            <div className="cabinet-ann-images">
              <span className="apps-field__label">Рекламний баннер (16:9)</span>
              <label className="cabinet-avatar-upload">
                {bannerImage ? "Замінити баннер" : "Додати баннер"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onAddBanner(e)}
                  hidden
                />
              </label>
              {bannerImage && (
                <span className="cabinet-ann-img">
                  <img src={bannerImage} alt="Баннер" />
                  <button type="button" onClick={() => setBannerImage(null)} aria-label="Прибрати">
                    ×
                  </button>
                </span>
              )}
              <label className="apps-field">
                <span className="apps-field__label">Або відео-посилання (реклама)</span>
                <input
                  type="url"
                  value={bannerVideo}
                  onChange={(e) => setBannerVideo(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
            </div>
          )}

          <div className="cabinet-ann-preview">
            <span className="apps-field__label">Прев'ю</span>
            {type === "short" ? (
              <div className="cabinet-ann-preview-short">
                {text || "Коротке оголошення з'явиться в біжучій строкі..."}
              </div>
            ) : (
              <div className="cabinet-ann-preview-regular">
                <strong>{title || "Заголовок"}</strong>
                <p>{summary || "Короткий опис..."}</p>
                <p>{text || "Текст оголошення..."}</p>
                {images.length > 0 && (
                  <span className="cabinet-ann-preview-imgs">
                    {images.map((_, i) => (
                      <span key={i} className="cabinet-ann-preview-imgbox" />
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="cabinet-ann-actions">
            <button type="submit" className="portal-cta" disabled={saving}>
              {saving ? "..." : editingId ? "Оновити" : "Опублікувати"}
            </button>
            {editingId && (
              <button type="button" className="cabinet-logout" onClick={resetForm}>
                Скасувати
              </button>
            )}
          </div>
        </form>
        {shortFull && <p className="cabinet-profile-note">Максимум 80 символів.</p>}
        {descFull && (
          <p className="cabinet-profile-note">Максимум {REGULAR_DESC_MAX} символів.</p>
        )}
        {msg && <p className="cabinet-profile-error">{msg}</p>}
        <ul className="cabinet-apps" style={{ marginTop: "0.8rem" }}>
          {items.map((item) => (
            <li key={item.id} className="cabinet-apps__item">
              <div className="cabinet-apps__head">
                <span style={{ fontSize: "0.85rem" }}>
                  [{item.type === "short" ? "коротке" : "звичайне"}]{" "}
                  {item.visibility !== "general" ? `[${item.visibility}] ` : ""}
                  {item.title ? `${item.title} — ` : ""}
                  {(item.summary ?? item.text).slice(0, 80)}
                </span>
                <span style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    type="button"
                    className="cabinet-logout"
                    onClick={() => void onToggle(item)}
                  >
                    {item.active ? "Вимкнути" : "Увімкнути"}
                  </button>
                  <button
                    type="button"
                    className="cabinet-logout"
                    onClick={() => onEdit(item)}
                  >
                    Редагувати
                  </button>
                  {item.type === "regular" && (
                    <button
                      type="button"
                      className="cabinet-logout"
                      onClick={() => void onCopyLink(item.id)}
                    >
                      Посилання
                    </button>
                  )}
                  <button
                    type="button"
                    className="cabinet-logout"
                    onClick={() => void onDelete(item.id)}
                  >
                    Видалити
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PanelPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PanelTab>("appeals");

  useEffect(() => {
    void (async () => {
      const me = await fetchMe();
      setUser(me);
      setLoading(false);
    })();
  }, []);

  const isReviewer = user ? hasAnyRole(user.roles, REVIEWER_ROLES_UI) : false;
  const isAssigner = user ? hasAnyRole(user.roles, ASSIGNER_ROLES_UI) : false;
  const canManageAnn = user ? hasAnyRole(user.roles, MANAGE_ANN_ROLES_UI) : false;
  const canCallCenter = user
    ? hasAnyRole(user.roles, APPOINTMENT_REVIEW_ROLES_UI)
    : false;
  const isSysadmin = user ? user.roles.includes("sysadmin") : false;

  const tabs: { id: PanelTab; label: string }[] = [];
  if (isReviewer) {
    tabs.push({ id: "appeals", label: "Звернення" });
    tabs.push({ id: "jobs", label: "Заявки" });
  }
  if (canCallCenter) tabs.push({ id: "callcenter", label: "Кол-центр" });
  if (canManageAnn) tabs.push({ id: "constructor", label: "Конструктор" });
  if (isAssigner) tabs.push({ id: "roles", label: "Посади" });
  if (isSysadmin) tabs.push({ id: "users", label: "Користувачі" });

  const allowed = tabs.some((t) => t.id === tab);
  const activeTab = allowed ? tab : tabs[0]?.id ?? "appeals";

  return (
    <PortalLayout title="Панель працівника">
      {loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : !user || tabs.length === 0 ? (
        <div className="p-block">
          <div className="p-block__head">Доступ обмежено</div>
          <div className="p-block__body">
            <p className="cabinet-profile-note">
              Ця сторінка доступна працівникам лікарні. Увійдіть через Google під
              обліковим записом з відповідною посадою.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="cabinet-tabs" style={{ marginBottom: "1rem" }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cabinet-tab${activeTab === t.id ? " cabinet-tab--on" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTab === "appeals" && <ReviewPanel kind="appeals" />}
          {activeTab === "jobs" && <ReviewPanel kind="jobs" />}
          {activeTab === "callcenter" && <AppointmentsQueue />}
          {activeTab === "constructor" && <AnnouncementsManage />}
          {activeTab === "roles" && <RolesPanel />}
          {activeTab === "users" && <UsersBanPanel />}
        </>
      )}
    </PortalLayout>
  );
}


function UsersBanPanel() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await fetchAdminUsers();
    setUsers(list);
    setErr(list.length ? null : "Не вдалося завантажити користувачів");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onBan = async (u: AdminUserItem) => {
    const banned = !u.banned;
    let reason: string | undefined;
    if (banned) {
      const r = window.prompt("Причина блокування:", "");
      if (r === null) return;
      reason = r.trim() || "Не вказано";
    }
    setBusyId(u.id);
    const res = await adminSetBan(u.id, banned, reason);
    setBusyId(null);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setErr(null);
    await load();
  };

  if (loading) {
    return (
      <div className="p-block">
        <div className="p-block__body">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="p-block">
      <div className="p-block__head">Користувачі</div>
      <div className="p-block__body">
        {err && <p className="cabinet-auth-msg cabinet-auth-msg--err">{err}</p>}
        <table className="panel-users">
          <thead>
            <tr>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Посади</th>
              <th>IP</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.banned ? "panel-users__row--banned" : undefined}>
                <td>{u.name}</td>
                <td>{u.email ?? "—"}</td>
                <td>{u.roles.join(", ") || "—"}</td>
                <td>{u.lastIp ?? "—"}</td>
                <td>
                  {u.banned ? (
                    <span className="panel-users__ban" title={u.bannedReason ?? ""}>
                      Заблоковано
                    </span>
                  ) : (
                    "Активний"
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className="cabinet-logout"
                    disabled={busyId === u.id}
                    onClick={() => void onBan(u)}
                  >
                    {busyId === u.id
                      ? "..."
                      : u.banned
                        ? "Розблокувати"
                        : "Заблокувати"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
