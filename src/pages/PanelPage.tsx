import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  adminExportUser,
  adminSetBan,
  adminUserAction,
  announcementLink,
  assignRole,
  copyText,
  deleteAnnouncement,
  deleteApplication,
  deleteAppointment,
  deleteInvite,
  fetchAccountRequests,
  fetchAdminUsers,
  fetchAnnouncementsManage,
  fetchApplicationsReview,
  fetchAppointmentMessages,
  fetchAppointmentsQueue,
  fetchInvites,
  fetchMessages,
  fetchMe,
  resolveAccountRequest,
  saveAnnouncement,
  sendAppointmentMessage,
  sendMessage,
  setApplicationStatus,
  setAppointmentStatus,
  type AccountRequestItem,
  type AnnouncementItem,
  type AdminUserItem,
  type ApplicationItem,
  type AppointmentItem,
  type DialogueMessage,
  type InviteItem,
  type PublicUser,
} from "../api";
import { PortalLayout } from "../components/PortalLayout";
import { VideoPreview } from "../components/Announcements";
import { renderMiniMarkdown, stripShortFormatting } from "../components/annMarkdown";
import {
  ROLE_LABELS_UI,
  ROLE_ICONS_UI,
  REVIEWER_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  APPOINTMENT_REVIEW_ROLES_UI,
  hasAnyRole,
} from "../data/roles";
import "./CabinetPage.css";
import "../components/Announcements.css";

const APPOINTMENT_STATUS_LABELS_UI: Record<string, string> = {
  new: "Нова",
  in_progress: "У роботі",
  accepted: "Прийнята",
  rejected: "Відхилена",
};

type PanelTab = "appeals" | "jobs" | "callcenter" | "constructor" | "roles" | "users";

function ProfileModal({
  author,
  onClose,
}: {
  author: NonNullable<ApplicationItem["author"]>;
  onClose: () => void;
}) {
  const roles = (author.roles ?? []).filter((r) => r !== "sysadmin");
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__head">
          <strong>Профіль</strong>
          <button type="button" className="profile-modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="profile-modal__body">
          <div className="profile-modal__header">
            {author.avatar ? (
              <img src={author.avatar} alt="" className="profile-modal__avatar" />
            ) : (
              <div className="profile-modal__avatar profile-modal__avatar--empty">
                <Icon icon="mdi:account" width={32} height={32} />
              </div>
            )}
            <div>
              <p className="profile-modal__name">{author.name}</p>
              {roles.length > 0 && (
                <span className="cabinet-role-badges">
                  {roles.map((r) => (
                    <span key={r} className="cabinet-role-icon" title={ROLE_LABELS_UI[r] ?? r}>
                      <Icon icon={ROLE_ICONS_UI[r] ?? "mdi:account"} width={16} height={16} />
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          <p><strong>Email:</strong> {author.email ?? "—"}</p>
          {author.age != null && <p><strong>Вік:</strong> {author.age}</p>}
          {author.registeredAt && (
            <p>
              <strong>Реєстрація:</strong>{" "}
              {new Date(author.registeredAt + "Z").toLocaleDateString("uk-UA")}
            </p>
          )}
          {author.bio && (
            <p><strong>Про себе:</strong> {author.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewChat({
  app,
  onChanged,
  onProfile,
  onStatus,
}: {
  app: ApplicationItem;
  onChanged: () => void;
  onProfile: () => void;
  onStatus: (status: string, needNote?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const res = await fetchMessages(app.id);
    setMessages(res.messages);
  }, [app.id]);

  useEffect(() => {
    if (!open) return;
    void load();
    const t = window.setInterval(() => void load(), 2000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [open, load]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setSending(true);
    let imageUrl: string | undefined;
    if (file) {
      const reader = new FileReader();
      imageUrl = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    const res = await sendMessage(app.id, text.trim() || "📎", imageUrl);
    setSending(false);
    if (res.ok) {
      setText("");
      setFile(null);
      void load();
      onChanged();
    }
  };

  const decided = app.status === "accepted" || app.status === "rejected";

  return (
    <>
      {!decided && !open && (
        <div className="cabinet-review-actions" style={{ marginBottom: "0.5rem" }}>
          {(app.status === "reviewing" || app.status === "dialogue") && (
            <>
              <button
                type="button"
                className="cabinet-action cabinet-action--ok"
                onClick={() => onStatus("accepted", true)}
              >
                Прийняти
              </button>
              <button
                type="button"
                className="cabinet-action cabinet-action--no"
                onClick={() => onStatus("rejected", true)}
              >
                Відхилити
              </button>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        className="cabinet-action cabinet-action--dialogue"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Закрити чат" : "Діалог"}
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
                  <span
                    className={`cabinet-chat__who${!m.isReviewer ? " cabinet-chat__who--clickable" : ""}`}
                    onClick={!m.isReviewer ? onProfile : undefined}
                  >
                    {m.senderName}
                  </span>
                  {m.body && <p>{m.body}</p>}
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="" className="cabinet-chat__img" />
                  )}
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
            <label className="cabinet-chat__attach" title="Прикріпити зображення">
              📎
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file && (
              <span className="cabinet-chat__file">{file.name}</span>
            )}
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
  const [profileAuthor, setProfileAuthor] = useState<
    NonNullable<ApplicationItem["author"]> | null
  >(null);

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

  const onDelete = async (id: string) => {
    if (!window.confirm("Видалити цю заявку назавжди?")) return;
    setMsg(null);
    const res = await deleteApplication(id);
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
                  <div className="cabinet-apps__author">
                    {app.author.avatar ? (
                      <img src={app.author.avatar} alt="" className="cabinet-apps__avatar" />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span
                        className="author-link"
                        onClick={() => setProfileAuthor(app.author!)}
                      >
                        {app.author.name}
                      </span>
                      <span className="cabinet-apps__date">
                        {new Date(app.createdAt + "Z").toLocaleString("uk-UA")}
                      </span>
                    </div>
                  </div>
                )}
                <ul className="cabinet-review-answers">
                  {app.answers.map((a, i) => (
                    <li key={i}>
                      <strong>{a.label}:</strong> {a.value}
                    </li>
                  ))}
                </ul>
                {(app.status === "accepted" || app.status === "rejected") && (
                  <div className="cabinet-apps__note">
                    Причина: {app.decisionNote || "Не вказана"}
                  </div>
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
                  {app.status !== "accepted" && app.status !== "rejected" && (
                    <ReviewChat
                      app={app}
                      onChanged={() => void load()}
                      onProfile={() => app.author && setProfileAuthor(app.author)}
                      onStatus={(status, needNote) => void onStatus(app.id, status, needNote)}
                    />
                  )}
                  {(app.status === "accepted" || app.status === "rejected") && (
                    <button
                      type="button"
                      className="cabinet-action cabinet-action--no"
                      onClick={() => void onDelete(app.id)}
                    >
                      Видалити
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {profileAuthor && (
        <ProfileModal author={profileAuthor} onClose={() => setProfileAuthor(null)} />
      )}
    </div>
  );
}

function AppointmentsQueue() {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "done">("new");
  const [msg, setMsg] = useState<string | null>(null);
  const [profileAuthor, setProfileAuthor] = useState<
    NonNullable<ApplicationItem["author"]> | null
  >(null);

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

  const onDelete = async (id: string) => {
    if (!window.confirm("Видалити цей запис назавжди?")) return;
    setMsg(null);
    const res = await deleteAppointment(id);
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
                  <div className="cabinet-apps__author">
                    {a.author.avatar ? (
                      <img src={a.author.avatar} alt="" className="cabinet-apps__avatar" />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span
                        className="author-link"
                        onClick={() => setProfileAuthor(a.author!)}
                      >
                        {a.author.name}
                      </span>
                      <span className="cabinet-apps__date">
                        {new Date(a.createdAt + "Z").toLocaleString("uk-UA")}
                      </span>
                    </div>
                  </div>
                )}
                <div className="cabinet-apps__date">Бажана дата: {a.wantDate}</div>
                <div className="cabinet-review-answers">
                  <p>{a.body}</p>
                </div>
                {(a.status === "accepted" || a.status === "rejected") && (
                  <div className="cabinet-apps__note">
                    Причина: {a.decisionNote || "Не вказана"}
                  </div>
                )}
                <PanelAppointmentChat appointment={a} />
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
                  {(a.status === "accepted" || a.status === "rejected") && (
                    <button
                      type="button"
                      className="cabinet-action cabinet-action--no"
                      onClick={() => void onDelete(a.id)}
                    >
                      Видалити
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {profileAuthor && (
        <ProfileModal author={profileAuthor} onClose={() => setProfileAuthor(null)} />
      )}
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
        if (file.type === "image/gif") {
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

    if (
      selected.startsWith(before) &&
      selected.endsWith(after) &&
      selected.length >= before.length + after.length
    ) {
      const stripped = selected.slice(before.length, selected.length - after.length);
      const next = text.slice(0, start) + stripped + text.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + stripped.length);
      });
      return;
    }

    const beforeText = text.slice(0, start);
    const afterText = text.slice(end);
    if (
      beforeText.endsWith(before) &&
      afterText.startsWith(after)
    ) {
      const next =
        text.slice(0, start - before.length) +
        selected +
        text.slice(end + after.length);
      setText(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start - before.length, start - before.length + selected.length);
      });
      return;
    }

    let plain = selected;
    if (before === after && (before === "**" || before === "*")) {
      plain = plain.replace(
        new RegExp(`\\${before}([^*]*)\\${before}`, "g"),
        "$1",
      );
    } else if (before === "~~" && after === "~~") {
      plain = plain.replace(/~~([^~]*)~~/g, "$1");
    }
    const next = text.slice(0, start) + before + plain + after + text.slice(end);
    setText(next);
    const innerLen = plain.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + innerLen);
    });
  };

  const listBlock = (marker: string) => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    if (
      marker === "1. " &&
      selected.split("\n").every((l) => /^\d+\.\s/.test(l) || !l.trim())
    ) {
      const stripped = selected
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s/, ""))
        .join("\n");
      setText(text.slice(0, start) + stripped + text.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + stripped.length);
      });
      return;
    }
    if (marker === "- " && selected.split("\n").every((l) => l.startsWith("- ") || !l.trim())) {
      const stripped = selected
        .split("\n")
        .map((l) => (l.startsWith(marker) ? l.slice(marker.length) : l))
        .join("\n");
      setText(text.slice(0, start) + stripped + text.slice(end));
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + stripped.length);
      });
      return;
    }
    const marked = (selected || "Пункт")
      .split("\n")
      .map((l) => (l.trim() ? marker + l.replace(/^\s*[-*]\s+/, "") : l))
      .join("\n");
    setText(text.slice(0, start) + marked + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marked.length, start + marked.length);
    });
  };

  const insertHeading = () => {
    const el = areaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    if (text.slice(lineStart).startsWith("## ")) {
      const next = text.slice(0, lineStart) + text.slice(lineStart + 3);
      setText(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start - 3, start - 3);
      });
      return;
    }
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
    const finalText = type === "short" ? stripShortFormatting(text) : text;
    const res = await saveAnnouncement({
      type,
      title: type === "regular" ? title : undefined,
      summary: type === "regular" ? summary : undefined,
      text: finalText,
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
              <button
                type="button"
                onClick={() => listBlock("- ")}
                title="Маркований список"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => listBlock("1. ")}
                title="Нумерований список"
              >
                1.
              </button>
              <button
                type="button"
                onClick={() => wrapSelection("`")}
                title="Моноширинний"
              >
                {"</>"}
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
                {stripShortFormatting(text) || "Коротке оголошення з'явиться в біжучій строкі..."}
              </div>
            ) : (
              <div className="cabinet-ann-preview-regular">
                <strong>{title || "Заголовок"}</strong>
                <p>{summary || "Короткий опис..."}</p>
                <div className="ann-md">{renderMiniMarkdown(text || "Текст оголошення...")}</div>
                {images.length > 0 && (
                  <span className="cabinet-ann-preview-imgs">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt={`Прев'ю ${i + 1}`} className="cabinet-ann-preview-img" />
                    ))}
                  </span>
                )}
                {videoLinks.map((link, i) => (
                  <VideoPreview key={`pv${i}`} url={link} />
                ))}
                {bannerImage && (
                  <img src={bannerImage} alt="Баннер" className="cabinet-ann-preview-img" />
                )}
                {bannerVideo && <VideoPreview url={bannerVideo} />}
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


function shortUa(ua: string | null): string {
  if (!ua) return "—";
  const b = /Firefox\//.test(ua)
    ? "Firefox"
    : /Edg\//.test(ua)
      ? "Edge"
      : /OPR\//.test(ua)
        ? "Opera"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Інший";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${b} · ${os}` : b;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
}

function PanelAppointmentChat({ appointment }: { appointment: AppointmentItem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const terminal = appointment.status === "accepted" || appointment.status === "rejected";

  const loadMessages = useCallback(async () => {
    const res = await fetchAppointmentMessages(appointment.id);
    setMessages(res.messages);
  }, [appointment.id]);

  useEffect(() => {
    if (!open) return;
    void loadMessages();
    const t = window.setInterval(() => void loadMessages(), 2000);
    return () => window.clearInterval(t);
  }, [open, loadMessages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body && !file) return;
    setSending(true);
    let imageUrl: string | undefined;
    if (file) {
      const reader = new FileReader();
      imageUrl = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
    const res = await sendAppointmentMessage(appointment.id, body || "📎", imageUrl);
    setSending(false);
    if (!res.ok) return;
    setText("");
    setFile(null);
    await loadMessages();
  };

  return (
    <div className="cabinet-chat">
      {!terminal && (
        <button type="button" className="cabinet-chat__toggle" onClick={() => setOpen(!open)}>
          {open ? "Закрити чат" : `Чат з пацієнтом (${messages.length || "відкрити"})`}
        </button>
      )}
      {open && !terminal && (
        <div className="cabinet-chat__body">
          <ul className="cabinet-chat__list">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`cabinet-chat__msg${m.isReviewer ? " cabinet-chat__msg--staff" : " cabinet-chat__msg--user"}`}
              >
                <span className="cabinet-chat__author">{m.senderName}</span>
                {m.body && <p>{m.body}</p>}
                {m.imageUrl && (
                  <img src={m.imageUrl} alt="" className="cabinet-chat__img" />
                )}
                <span className="cabinet-chat__date">
                  {new Date(m.createdAt + "Z").toLocaleString("uk-UA")}
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={onSend} className="cabinet-chat__form">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написати пацієнту..."
              maxLength={4000}
            />
            <button type="submit" className="portal-cta" disabled={sending}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function UsersBanPanel() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [requests, setRequests] = useState<AccountRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [list, reqs] = await Promise.all([fetchAdminUsers(), fetchAccountRequests()]);
    setUsers(list);
    setRequests(reqs.filter((r) => r.status === "pending"));
    setErr(list.length ? null : "Не вдалося завантажити користувачів");
    setLoading(false);
    const me = await fetchMe();
    setMeId(me?.id ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (!res.ok) {
      setErr((res as { error?: string }).error ?? "Помилка");
      return;
    }
    setErr(null);
    await load();
  };

  const onBan = async (u: AdminUserItem) => {
    const banned = !u.banned;
    let reason: string | undefined;
    let banIp = false;
    let banUa = false;
    if (banned) {
      const r = window.prompt("Причина блокування:", "");
      if (r === null) return;
      reason = r.trim() || "Не вказано";
      banIp = window.confirm("Також заблокувати цей IP-адресу?");
      banUa = window.confirm("Також заблокувати цей браузер (user-agent)?");
    }
    await run(u.id, () => adminSetBan(u.id, banned, reason, { banIp, banUa }));
  };

  const onWarn = async (u: AdminUserItem) => {
    const r = window.prompt("Причина попередження:", "");
    if (r === null) return;
    await run(u.id, () =>
      adminUserAction(u.id, "warn", { reason: r.trim() || "Не вказано" }),
    );
  };

  const onTimeout = async (u: AdminUserItem) => {
    const h = window.prompt("На скільки годин заблокувати? (1–720)", "24");
    if (h === null) return;
    const hours = Number(h);
    if (!Number.isFinite(hours) || hours < 1 || hours > 720) {
      setErr("Введіть число від 1 до 720");
      return;
    }
    await run(u.id, () => adminUserAction(u.id, "timeout", { hours }));
  };

  const onDelete = async (u: AdminUserItem) => {
    const confirmText = window.prompt(
      `Це остаточно видалить акаунт "${u.email ?? u.name}".\nВведіть DELETE для підтвердження:`,
      "",
    );
    if (confirmText !== "DELETE") return;
    await run(u.id, () => adminUserAction(u.id, "delete"));
  };

  const onExport = async (u: AdminUserItem) => {
    setBusyId(u.id);
    const res = await adminExportUser(u.id);
    setBusyId(null);
    if (!res.ok) setErr(res.error);
  };

  const onResolveRequest = async (req: AccountRequestItem, done: boolean) => {
    const note = window.prompt("Причина / коментар (необов'язково):") ?? undefined;
    if (note === null) return;
    await run(req.userId, () => resolveAccountRequest(req.id, done, note || undefined));
  };

  if (loading) {
    return (
      <div className="p-block">
        <div className="p-block__body">Завантаження...</div>
      </div>
    );
  }

  return (
    <>
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">
          Запити на експорт / видалення даних
        </div>
        <div className="p-block__body">
          {requests.length === 0 ? (
            <p className="cabinet-profile-note">Немає активних запитів.</p>
          ) : (
            <ul className="panel-requests">
              {requests.map((r) => (
                <li key={r.id} className="panel-requests__item">
                  <strong>{r.name}</strong> ({r.email ?? "—"})
                  <span>
                    · {r.kind === "export" ? "Експорт даних" : "Видалення акаунта"} ·{" "}
                    {fmtDate(r.createdAt)}
                  </span>
                  <div className="panel-requests__actions">
                    <button
                      type="button"
                      className="cabinet-logout"
                      disabled={busyId === r.userId}
                      onClick={() => void onResolveRequest(r, true)}
                    >
                      Виконано
                    </button>
                    <button
                      type="button"
                      className="cabinet-logout"
                      disabled={busyId === r.userId}
                      onClick={() => void onResolveRequest(r, false)}
                    >
                      Відхилити
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head">Користувачі</div>
        <div className="p-block__body">
          {err && <p className="cabinet-auth-msg cabinet-auth-msg--err">{err}</p>}
          <div className="panel-users-wrap">
            <table className="panel-users">
              <thead>
                <tr>
                  <th>ПІБ</th>
                  <th>Email</th>
                  <th>Посади</th>
                  <th>IP</th>
                  <th>Пристрій</th>
                  <th>Реєстрація</th>
                  <th>Активність</th>
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
                    <td className="panel-users__ip">{u.lastIp ?? "—"}</td>
                    <td title={u.lastUa ?? ""}>{shortUa(u.lastUa)}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>{fmtDate(u.lastSeen)}</td>
                    <td>
                      {u.banned ? (
                        <span className="panel-users__ban" title={u.bannedReason ?? ""}>
                          Заблоковано
                        </span>
                      ) : u.blockedUntil && new Date(u.blockedUntil + (u.blockedUntil.endsWith("Z") ? "" : "Z")) > new Date() ? (
                        <span className="panel-users__ban" title={u.warningReason ?? ""}>
                          Тимчасово до {fmtDate(u.blockedUntil)}
                        </span>
                      ) : (
                        <span>
                          Активний
                          {u.warnings > 0 && (
                            <span className="panel-users__warn" title={u.warningReason ?? ""}>
                              <Icon icon="mdi:alert-outline" width={13} height={13} />{" "}
                              {u.warnings}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="panel-users__actions">
                        {!u.banned && u.id !== meId && (
                          <>
                            <button
                              type="button"
                              className="cabinet-logout"
                              disabled={busyId === u.id}
                              onClick={() => void onWarn(u)}
                              title="Попередження"
                            >
                              <Icon icon="mdi:alert-outline" width={15} height={15} />
                            </button>
                            <button
                              type="button"
                              className="cabinet-logout"
                              disabled={busyId === u.id}
                              onClick={() => void onTimeout(u)}
                              title="Тимчасова блокування"
                            >
                              <Icon icon="mdi:timer-sand" width={15} height={15} />
                            </button>
                          </>
                        )}
                        {u.blockedUntil && u.id !== meId && (
                          <button
                            type="button"
                            className="cabinet-logout"
                            disabled={busyId === u.id}
                            onClick={() => void run(u.id, () => adminUserAction(u.id, "unblock"))}
                          >
                            Розблок.
                          </button>
                        )}
                        <button
                          type="button"
                          className="cabinet-logout"
                          disabled={busyId === u.id}
                          onClick={() => void onExport(u)}
                          title="Експорт даних (JSON)"
                        >
                          <Icon icon="mdi:download" width={15} height={15} />
                        </button>
                        <button
                          type="button"
                          className="cabinet-logout"
                          disabled={busyId === u.id || u.id === meId}
                          onClick={() => void onDelete(u)}
                          title="Видалити акаунт"
                        >
                          <Icon icon="mdi:close" width={15} height={15} />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
