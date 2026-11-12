import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import {
  adminExportUser,
  adminSetBan,
  adminUserAction,
  announcementLink,
  archiveDocumentation,
  assignRole,
  closeApplicationDialogue,
  closeAppointmentDialogue,
  copyText,
  deleteAnnouncement,
  deleteApplication,
  deleteAppointment,
  deleteApplicationMessage,
  deleteAppointmentMessage,
  deleteDocumentation,
  deleteInvite,
  fetchAccountRequests,
  fetchAdminUsers,
  fetchAnnouncementsManage,
  fetchApplicationsReview,
  fetchAppointmentMessages,
  fetchAppointmentsQueue,
  fetchArchive,
  fetchAuditArchives,
  fetchAuditLog,
  fetchDocumentationManage,
  fetchEmailLog,
  fetchInvites,
  fetchPersonalizationRegistry,
  fetchUserPersonalization,
  downloadAuditArchive,
  fetchMessages,
  fetchMe,
  fetchUserWarnings,
  resolveAccountRequest,
  revokeRole,
  savePersonalization,
  setSpecialization,
  saveAnnouncement,
  saveDocumentation,
  updateApplicationMessage,
  updateAppointmentMessage,
  sendAppointmentMessage,
  sendMessage,
  setApplicationStatus,
  setAppointmentStatus,
  type AccountRequestItem,
  type AnnouncementItem,
  type AdminUserItem,
  type ApplicationItem,
  type AppointmentItem,
  type AuditArchiveItem,
  type AuditEntry,
  type DialogueMessage,
  type DocumentationItem,
  type EmailLogItem,
  type InviteItem,
  type PersonalizationCategory,
  type PersonalizationItem,
  type PublicAnnouncement,
  type PublicUser,
  type WarningHistoryItem,
} from "../api";
import { PortalLayout } from "../components/PortalLayout";
import { Lightbox, VideoPreview } from "../components/Announcements";
import { ProfileModal, type ProfileUser } from "../components/ProfileModal";
import { ChatDocCard, ChatImage } from "../components/ChatFiles";
import {
  compressImageForChat,
  DOCS_MAX,
  formatFileSize,
  readDocDataUrl,
} from "../utils/chatFiles";
import { renderMiniMarkdown, stripShortFormatting } from "../components/annMarkdown";
import {
  ROLE_LABELS_UI,
  REVIEWER_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  APPOINTMENT_REVIEW_ROLES_UI,
  hasAnyRole,
} from "../data/roles";
import { formatUaShort } from "../utils/userAgent";
import { formatCountry } from "../utils/countries";
import { formatIp } from "../utils/ip";
import "./CabinetPage.css";
import "../components/Announcements.css";

const APPOINTMENT_STATUS_LABELS_UI: Record<string, string> = {
  new: "Нова",
  in_progress: "На розгляді",
  dialogue: "Діалог",
  accepted: "Прийнята",
  rejected: "Відхилена",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "application.create": "Подання звернення",
  "job.create": "Подання заявки на посаду",
  "job.status": "Рішення за заявкою на посаду",
  "job.dialogue_close": "Діалог за заявкою на посаду завершено",
  "job.message": "Повідомлення у діалозі заявки на посаду",
  warn: "Попередження",
  "warn.block": "Попередження (з блокуванням)",
  "warning.remove": "Видалено попередження",
  timeout: "Тимчасове блокування",
  unblock: "Розблокування",
  "user.ban": "Блокування акаунта",
  "user.unban": "Розблокування акаунта",
  "user.delete": "Видалення акаунта",
  "user.specialization": "Зміна спеціалізації",
  "user.personalization": "Зміна персоналізації",
  "user.edit_name": "Зміна ПІБ",
  "role.assign": "Надано посаду",
  "invite.create": "Надіслано запрошення",
  "application.status": "Рішення за зверненням",
  "application.dialogue_close": "Діалог за зверненням завершено",
  "application.message": "Повідомлення у діалозі звернення",
  "appointment.create": "Подання запису на прийом",
  "appointment.status": "Рішення за записом",
  "appointment.dialogue_close": "Діалог за записом завершено",
  "appointment.message": "Повідомлення у діалозі запису",
  "account_request.resolve": "Запит на експорт / видалення",
  "documentation.create": "Створення документа",
  "documentation.update": "Редагування документа",
  "documentation.delete": "Видалення документа",
  "documentation.archive": "Документ в архів",
  "documentation.restore": "Документ повернуто з архіву",
  "role.revoke": "Знято посаду",
};

const AUDIT_MESSAGE_ACTIONS = new Set(["application.message", "job.message", "appointment.message"]);

type PanelTab =
  | "overview"
  | "appeals"
  | "jobs"
  | "callcenter"
  | "constructor"
  | "docs"
  | "archive"
  | "roles"
  | "users";

const TAB_ICONS: Record<PanelTab, string> = {
  overview: "mdi:view-dashboard-outline",
  appeals: "mdi:email-outline",
  jobs: "mdi:briefcase-outline",
  callcenter: "mdi:headset",
  constructor: "mdi:bullhorn-outline",
  docs: "mdi:file-document-outline",
  archive: "mdi:archive-outline",
  roles: "mdi:account-key-outline",
  users: "mdi:account-group-outline",
};

function ReviewChat({
  app,
  onChanged,
  onProfile,
  onStatus,
  user,
}: {
  app: ApplicationItem;
  onChanged: () => void;
  onProfile: () => void;
  onStatus: (status: string, needNote?: boolean) => void;
  user: PublicUser | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<{ name: string; data: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoOn, setVideoOn] = useState(false);
  const [closedLocal, setClosedLocal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm("Видалити це повідомлення?")) return;
    setErr(null);
    const res = await deleteApplicationMessage(app.id, messageId);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEditingMessageId(null);
    await load();
    onChanged();
  };

  const saveEditedMessage = async (messageId: string) => {
    const body = editingText.trim();
    if (!body) {
      setErr("Повідомлення не може бути порожнім");
      return;
    }
    setErr(null);
    const res = await updateApplicationMessage(app.id, messageId, body);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEditingMessageId(null);
    setEditingText("");
    await load();
    onChanged();
  };

  const load = useCallback(async () => {
    try {
      const res = await fetchMessages(app.id);
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
      if (res?.dialogueClosed) setClosedLocal(true);
    } catch {
      setMessages([]);
      setErr("Не вдалося завантажити історію діалогу.");
    }
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
    const video = videoUrl.trim();
    if (!text.trim() && !file && !video && !doc) return;
    if (video && !/^https?:\/\//i.test(video)) {
      setErr("Некоректне посилання на відео");
      return;
    }
    setErr(null);
    setSending(true);
    let imageUrl: string | undefined;
    if (file) {
      try {
        imageUrl = await compressImageForChat(file);
      } catch {
        setSending(false);
        setErr("Не вдалося обробити зображення");
        return;
      }
    }
    const res = await sendMessage(
      app.id,
      text.trim(),
      imageUrl,
      video || undefined,
      doc ?? undefined,
    );
    setSending(false);
    if (res.ok) {
      setText("");
      setFile(null);
      setDoc(null);
      setVideoUrl("");
      void load();
      onChanged();
    } else {
      setErr(res.error);
    }
  };

  const decided = app.status === "accepted" || app.status === "rejected";
  const closed = !!app.dialogueClosedAt || closedLocal;
  const showDecisionButtons = !decided && !open;
  const decisionGate = useRef(0);

  useLayoutEffect(() => {
    if (showDecisionButtons) decisionGate.current = Date.now() + 400;
  }, [showDecisionButtons]);

  const decide = (status: string) => {
    if (Date.now() < decisionGate.current) return;
    onStatus(status, true);
  };

  const onStartDialogue = async () => {
    if (Date.now() < decisionGate.current) return;
    setErr(null);
    const res = await setApplicationStatus(app.id, "dialogue");
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOpen(true);
    onChanged();
  };

  const onCloseDialogue = async () => {
    if (!window.confirm("Завершити діалог? Повторно відкрити його не можна.")) return;
    setErr(null);
    const res = await closeApplicationDialogue(app.id);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setClosedLocal(true);
    onChanged();
  };

  return (
    <>
      {!decided && !open && (
        <div className="cabinet-review-actions" style={{ marginBottom: "0.5rem" }}>
          <button
            type="button"
            className="cabinet-action cabinet-action--ok"
            onClick={() => decide("accepted")}
          >
            Прийняти
          </button>
          <button
            type="button"
            className="cabinet-action cabinet-action--no"
            onClick={() => decide("rejected")}
          >
            Відхилити
          </button>
          {app.status === "reviewing" && (
            <button
              type="button"
              className="cabinet-action cabinet-action--dialogue"
              onClick={onStartDialogue}
            >
              Почати діалог
            </button>
          )}
          {app.status === "dialogue" && !closed && (
            <button
              type="button"
              className="cabinet-action cabinet-action--dialogue"
              onClick={() => setOpen(true)}
            >
              Діалог
            </button>
          )}
        </div>
      )}
      {!closed && !decided && app.status === "dialogue" && (
        <button
          type="button"
          className="cabinet-action cabinet-action--no"
          onClick={() => void onCloseDialogue()}
        >
          Завершити діалог
        </button>
      )}
      {err && (
        <p className="cabinet-profile-error" style={{ width: "100%" }}>
          {err}
        </p>
      )}
      {closed && (
        <div className="cabinet-apps__note" style={{ width: "100%" }}>
          Діалог завершено
        </div>
      )}
      {(decided || closed) && !open && (
        <button
          type="button"
          className="cabinet-action cabinet-action--dialogue"
          onClick={() => setOpen(true)}
        >
          Історія діалогу
        </button>
      )}
      {open && (
        <div className="chat-modal-overlay" onClick={() => setOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal__head">
              <strong>Діалог — {app.formTitle}</strong>
              <button
                type="button"
                className="profile-modal__close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-modal__body">
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
                  {editingMessageId === m.id ? (
                    <div className="cabinet-chat__edit">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        maxLength={2000}
                      />
                      <div className="cabinet-chat__edit-actions">
                        <button type="button" className="portal-cta" onClick={() => void saveEditedMessage(m.id)}>
                          Зберегти
                        </button>
                        <button type="button" className="cabinet-action cabinet-action--no" onClick={() => {
                          setEditingMessageId(null);
                          setEditingText("");
                        }}>
                          Скасувати
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.body && <p>{m.body}</p>}
                      {m.imageUrl && (
                        <ChatImage url={m.imageUrl} />
                      )}
                      {m.videoUrl && <VideoPreview url={m.videoUrl} />}
                      {m.doc && (
                        <ChatDocCard name={m.doc.name} url={m.doc.url} size={m.doc.size} />
                      )}
                    </>
                  )}
                  {!decided && !closed && (m.senderId === user?.id || (user?.roles.includes("sysadmin") && m.isReviewer)) && (
                    <div className="cabinet-chat__actions">
                      {m.senderId === user?.id && (
                        <button
                          type="button"
                          className="cabinet-chat__action-btn"
                          onClick={() => {
                            setEditingMessageId(m.id);
                            setEditingText(m.body || "");
                          }}
                        >
                          Редагувати
                        </button>
                      )}
                      <button
                        type="button"
                        className="cabinet-chat__action-btn cabinet-chat__action-btn--danger"
                        onClick={() => void deleteMessage(m.id)}
                      >
                        Видалити
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!decided && !closed && (
            <form onSubmit={onSend} className="cabinet-chat__form">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Відповісти пацієнту..."
                maxLength={2000}
              />
              <label className="cabinet-chat__attach" title="Прикріпити зображення">
                <Icon icon="mdi:image-plus" width={18} height={18} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="cabinet-chat__attach" title="Прикріпити документ (PDF, TXT, DOC, DOCX)">
                <Icon icon="mdi:file-document-plus-outline" width={18} height={18} />
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    void readDocDataUrl(f)
                      .then((data) => setDoc({ name: f.name, data }))
                      .catch((er: Error) => setErr(er.message));
                  }}
                />
              </label>
              <button
                type="button"
                className="cabinet-chat__attach"
                title="Додати відео за посиланням"
                onClick={() => setVideoOn((v) => !v)}
              >
                <Icon icon="mdi:video-outline" width={18} height={18} />
              </button>
              {file && (
                <span className="cabinet-chat__file">{file.name}</span>
              )}
              {doc && (
                <span className="cabinet-chat__file">
                  {doc.name} ({formatFileSize(Math.round((doc.data.length * 3) / 4))})
                  <button
                    type="button"
                    className="cabinet-chat__file-remove"
                    onClick={() => setDoc(null)}
                  >
                    <Icon icon="mdi:close-circle" width={16} height={16} />
                  </button>
                </span>
              )}
              <button type="submit" className="portal-cta" disabled={sending}>
                {sending ? "..." : "Надіслати"}
              </button>
              {videoOn && (
                <div className="cabinet-chat__video">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Посилання на відео (YouTube, TikTok)..."
                    maxLength={500}
                  />
                </div>
              )}
            </form>
          )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewPanel({
  kind,
  user,
  focusId,
}: {
  kind: "appeals" | "jobs";
  user: PublicUser | null;
  focusId?: string | null;
}) {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "done">("new");
  const [msg, setMsg] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchApplicationsReview());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focusId || items.length === 0) return;
    const target = items.find((a) => a.id === focusId);
    if (!target) return;
    setTab(
      target.status === "new"
        ? "new"
        : target.status === "reviewing" || target.status === "dialogue"
          ? "active"
          : "done",
    );
  }, [focusId, items]);

  useEffect(() => {
    if (!focusId) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(`panel-app-${focusId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.clearInterval(timer);
      } else if (++tries >= 40) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [focusId]);

  const forKind = items.filter((a) =>
    kind === "jobs" ? a.formId === "job_application" : a.formId !== "job_application",
  );

  const filtered = forKind.filter((a) => {
    if (tab === "new") return a.status === "new";
    if (tab === "active") return a.status === "reviewing" || a.status === "dialogue";
    return a.status === "accepted" || a.status === "rejected";
  });

  const decisionGate = useRef(0);

  const onStatus = async (id: string, status: string, needNote = false) => {
    if ((status === "accepted" || status === "rejected") && Date.now() < decisionGate.current) {
      return;
    }
    decisionGate.current = Date.now() + 400;
    let note: string | undefined;
    if (needNote) {
      const raw = window.prompt("Причина / коментар (необов'язково):");
      if (raw === null) return;
      note = raw.trim() || undefined;
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
              <li id={`panel-app-${app.id}`} key={app.id} className="cabinet-apps__item">
                <div className="cabinet-apps__head">
                  <strong>{app.formTitle}</strong>
                  <span className={`cabinet-apps__status cabinet-apps__status--${app.status}`}>
                    {app.statusLabel}
                  </span>
                </div>
                {app.author && (
                  <div className="cabinet-apps__author">
                    {app.author.avatar ? (
                      <img
                        src={app.author.avatar}
                        alt=""
                        className="cabinet-apps__avatar"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span
                        className="author-link"
                        onClick={() => setProfileUser(app.author!)}
                      >
                        {app.author.name}
                      </span>
                      <span className="cabinet-apps__date">
                        {new Date(app.createdAt + "Z").toLocaleString("uk-UA")}
                      </span>
                    </div>
                  </div>
                )}
                {app.reviewer && (
                  <div className="cabinet-apps__author">
                    {app.reviewer.avatar ? (
                      <img
                        src={app.reviewer.avatar}
                        alt=""
                        className="cabinet-apps__avatar"
                      />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span className="cabinet-apps__date">
                        {app.status === "accepted" || app.status === "rejected"
                          ? "Розглядав: "
                          : "Розглядає: "}
                        <span
                          className="author-link"
                          onClick={() => setProfileUser(app.reviewer!)}
                        >
                          {app.reviewer.name}
                        </span>
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
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--review"
                        onClick={() => void onStatus(app.id, "reviewing")}
                      >
                        Розглянути
                      </button>
                    </>
                  )}
                  {app.status !== "new" && (
                    <ReviewChat
                      app={app}
                      onChanged={() => void load()}
                      onProfile={() => app.author && setProfileUser(app.author)}
                      onStatus={(status, needNote) => void onStatus(app.id, status, needNote)}
                      user={user}
                    />
                  )}
                  {(app.status === "accepted" || app.status === "rejected") &&
                    user?.roles.includes("sysadmin") && (
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
      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </div>
  );
}

function AppointmentsQueue({ user, focusId }: { user: PublicUser | null; focusId?: string | null }) {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [tab, setTab] = useState<"new" | "active" | "done">("new");
  const [msg, setMsg] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchAppointmentsQueue());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!focusId || items.length === 0) return;
    const target = items.find((a) => a.id === focusId);
    if (!target) return;
    setTab(
      target.status === "new"
        ? "new"
        : target.status === "in_progress" || target.status === "dialogue"
          ? "active"
          : "done",
    );
  }, [focusId, items]);

  useEffect(() => {
    if (!focusId) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(`panel-appointment-${focusId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.clearInterval(timer);
      } else if (++tries >= 40) {
        window.clearInterval(timer);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [focusId]);

  const filtered = items.filter((a) => {
    if (tab === "new") return a.status === "new";
    if (tab === "active") return a.status === "in_progress" || a.status === "dialogue";
    return a.status === "accepted" || a.status === "rejected";
  });

  const decisionGate = useRef(0);

  const onStatus = async (id: string, status: string, needNote = false) => {
    if ((status === "accepted" || status === "rejected") && Date.now() < decisionGate.current) {
      return;
    }
    decisionGate.current = Date.now() + 400;
    let note: string | undefined;
    if (needNote) {
      const raw = window.prompt("Коментар для пацієнта (необов'язково):");
      if (raw === null) return;
      note = raw.trim() || undefined;
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
            {filtered.map((a) => (
              <li id={`panel-appointment-${a.id}`} key={a.id} className="cabinet-apps__item">
                <div className="cabinet-apps__head">
                  <strong>Запис на прийом</strong>
                  <span className={`cabinet-apps__status cabinet-apps__status--${a.status}`}>
                    {APPOINTMENT_STATUS_LABELS_UI[a.status] ?? a.statusLabel}
                  </span>
                </div>
                {a.author && (
                  <div className="cabinet-apps__author">
                    {a.author.avatar ? (
                      <img
                        src={a.author.avatar}
                        alt=""
                        className="cabinet-apps__avatar"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span
                        className="author-link"
                        onClick={() => setProfileUser(a.author!)}
                      >
                        {a.author.name}
                      </span>
                      <span className="cabinet-apps__date">
                        {new Date(a.createdAt + "Z").toLocaleString("uk-UA")}
                      </span>
                    </div>
                  </div>
                )}
                {a.operator && (
                  <div className="cabinet-apps__author">
                    {a.operator.avatar ? (
                      <img
                        src={a.operator.avatar}
                        alt=""
                        className="cabinet-apps__avatar"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="cabinet-apps__avatar cabinet-apps__avatar--empty">
                        <Icon icon="mdi:account" width={20} height={20} />
                      </div>
                    )}
                    <div className="cabinet-apps__author-info">
                      <span className="cabinet-apps__date">
                        {a.status === "accepted" || a.status === "rejected"
                          ? "Розглядав: "
                          : "Розглядає: "}
                        <span
                          className="author-link"
                          onClick={() => setProfileUser(a.operator!)}
                        >
                          {a.operator.name}
                        </span>
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
                <div className="cabinet-review-actions">
                  {a.status === "new" && (
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
                      <button
                        type="button"
                        className="cabinet-action cabinet-action--review"
                        onClick={() => void onStatus(a.id, "in_progress")}
                      >
                        Розглянути
                      </button>
                    </>
                  )}
                  {a.status !== "new" && (
                    <PanelAppointmentChat
                      appointment={a}
                      onChanged={() => void load()}
                      onProfile={() => a.author && setProfileUser(a.author)}
                      onStatus={(status, needNote) => void onStatus(a.id, status, needNote)}
                      user={user}
                    />
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
      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </div>
  );
}

function RolesPanel() {
  const [section, setSection] = useState<
    "posts" | "roles" | "personalization" | "specialization"
  >("posts");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [mode, setMode] = useState<"assign" | "revoke">("assign");
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [assignable, setAssignable] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [specEmail, setSpecEmail] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [specSaving, setSpecSaving] = useState(false);
  const [specMsg, setSpecMsg] = useState<string | null>(null);
  const [pEmail, setPEmail] = useState("");
  const [pSelected, setPSelected] = useState<Set<string>>(new Set());
  const [pRegistry, setPRegistry] = useState<{
    categories: PersonalizationCategory[];
    items: PersonalizationItem[];
  } | null>(null);
  const [pLoading, setPLoading] = useState(false);
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchInvites();
    setInvites(res.invites);
    setAssignable(res.assignable);
    setRole((prev) => (prev && res.assignable.includes(prev) ? prev : res.assignable[0] ?? ""));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (section !== "personalization" || pRegistry) return;
    void fetchPersonalizationRegistry().then((r) => {
      if (r) setPRegistry(r);
    });
  }, [section, pRegistry]);

  const roleOptions = mode === "revoke" ? assignable.filter((r) => r !== "patient") : assignable;
  const effectiveRole = roleOptions.includes(role) ? role : roleOptions[0] ?? "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setInviteLink(null);

    if (mode === "revoke") {
      const res = await revokeRole(email.trim(), effectiveRole);
      setSaving(false);
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setMsg(`Посаду «${ROLE_LABELS_UI[effectiveRole] ?? effectiveRole}» знято з користувача ${email}.`);
      setEmail("");
      void load();
      return;
    }

    const res = await assignRole(email.trim(), effectiveRole);
    setSaving(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    if (res.assigned) {
      setMsg(`Роль «${ROLE_LABELS_UI[effectiveRole] ?? effectiveRole}» надано користувачу ${email}.`);
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

  const onSpecSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpecSaving(true);
    setSpecMsg(null);
    const res = await setSpecialization(specEmail.trim(), specValue.trim());
    setSpecSaving(false);
    if (!res.ok) {
      setSpecMsg(res.error);
      return;
    }
    setSpecMsg(
      res.specialization
        ? `Спеціалізацію «${res.specialization}» збережено для ${specEmail}.`
        : `Спеціалізацію користувача ${specEmail} очищено.`,
    );
    setSpecEmail("");
    setSpecValue("");
  };

  const onPLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    setPLoading(true);
    setPMsg(null);
    const res = await fetchUserPersonalization(pEmail.trim());
    setPLoading(false);
    if (!res.ok) {
      setPMsg(res.error);
      return;
    }
    setPSelected(new Set(res.personalization));
    setPMsg(null);
  };

  const onPSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPSaving(true);
    setPMsg(null);
    const res = await savePersonalization(pEmail.trim(), [...pSelected]);
    setPSaving(false);
    if (!res.ok) {
      setPMsg(res.error);
      return;
    }
    setPMsg(`Персоналізацію збережено (${res.personalization.length} значень).`);
  };

  const onDelete = async (token: string) => {
    await deleteInvite(token);
    void load();
  };

  const sectionNav = (
    <div className="cabinet-ann-mode">
      <button
        type="button"
        className={section === "posts" ? "is-active" : ""}
        onClick={() => setSection("posts")}
      >
        Посади
      </button>
      <button
        type="button"
        className={`cabinet-ann-soon${section === "roles" ? " is-active" : ""}`}
        onClick={() => setSection("roles")}
      >
        Ролі (в розробці)
      </button>
      <button
        type="button"
        className={section === "personalization" ? "is-active" : ""}
        onClick={() => setSection("personalization")}
      >
        Персоналізація
      </button>
      <button
        type="button"
        className={section === "specialization" ? "is-active" : ""}
        onClick={() => setSection("specialization")}
      >
        Спеціалізація
      </button>
    </div>
  );

  if (section === "roles") {
    return (
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Управління</div>
        <div className="p-block__body">
          {sectionNav}
          <p className="cabinet-profile-note">
            Видача та зняття ролей (персоналізація) — у розробці. Функція стане
            доступною після надання відповідних прав.
          </p>
        </div>
      </div>
    );
  }

  if (section === "personalization") {
    return (
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Управління</div>
        <div className="p-block__body">
          {sectionNav}
          <p className="cabinet-profile-note">
            Персоналізація — видима в профілі інформація про людину (кваліфікація,
            медперсонал, структурний підрозділ). Прав не надає. Знайдіть
            користувача за email, поставте галочки й застосуйте.
          </p>
          <form onSubmit={onPLoad} className="cabinet-roles-form">
            <label className="apps-field">
              <span className="apps-field__label">Email користувача</span>
              <input
                type="email"
                value={pEmail}
                onChange={(e) => setPEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </label>
            <button type="submit" className="portal-cta" disabled={pLoading}>
              {pLoading ? "..." : "Знайти"}
            </button>
          </form>
          {pRegistry && (
            <form onSubmit={onPSave} className="p-personalization">
              {pRegistry.categories.map((cat) => {
                const list = pRegistry.items.filter((i) => i.category === cat.id);
                if (list.length === 0) return null;
                return (
                  <fieldset key={cat.id} className="p-personalization__group">
                    <legend>{cat.label}</legend>
                    {list.map((item) => (
                      <label key={item.id} className="p-personalization__option">
                        <input
                          type="checkbox"
                          checked={pSelected.has(item.id)}
                          onChange={(e) => {
                            setPSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(item.id);
                              else next.delete(item.id);
                              return next;
                            });
                          }}
                        />
                        {item.label}
                      </label>
                    ))}
                  </fieldset>
                );
              })}
              <button
                type="submit"
                className="portal-cta"
                disabled={pSaving || !pEmail.trim()}
              >
                {pSaving ? "..." : "Застосувати"}
              </button>
            </form>
          )}
          {pMsg && <p className="cabinet-profile-note">{pMsg}</p>}
        </div>
      </div>
    );
  }

  if (section === "specialization") {
    return (
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Управління</div>
        <div className="p-block__body">
          {sectionNav}
          <p className="cabinet-profile-note">
            Спеціалізація працівника лікарні — текстове значення, яке показується
            у його профілі окремим рядком. Порожнє поле очищує значення.
          </p>
          <form onSubmit={onSpecSave} className="cabinet-roles-form">
            <label className="apps-field">
              <span className="apps-field__label">Email працівника</span>
              <input
                type="email"
                value={specEmail}
                onChange={(e) => setSpecEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </label>
            <label className="apps-field">
              <span className="apps-field__label">Спеціалізація</span>
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                placeholder="Наприклад: кардіолог"
                maxLength={200}
              />
            </label>
            <button type="submit" className="portal-cta" disabled={specSaving}>
              {specSaving ? "..." : "Застосувати"}
            </button>
          </form>
          {specMsg && <p className="cabinet-profile-note">{specMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Управління</div>
      <div className="p-block__body">
        {sectionNav}
        <p className="cabinet-profile-note">
          Посади, які ви можете призначати або знімати. Призначення: якщо
          користувач уже зареєстрований — посада надається одразу, інакше
          створюється запрошення (лист або посилання). Зняття: посада прибирається
          з користувача (решта посад не змінюються), а якщо список лишиться
          порожнім — залишається «Пацієнт». Призначення однієї з трьох
          директорських посад знімає попередню.
        </p>
        <div className="cabinet-ann-mode">
          <button
            type="button"
            className={mode === "assign" ? "is-active" : ""}
            onClick={() => setMode("assign")}
          >
            Призначити
          </button>
          <button
            type="button"
            className={mode === "revoke" ? "is-active" : ""}
            onClick={() => setMode("revoke")}
          >
            Зняти
          </button>
        </div>
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
            <span className="apps-field__label">
              {mode === "revoke" ? "Посада для зняття" : "Посада"}
            </span>
            <select value={effectiveRole} onChange={(e) => setRole(e.target.value)} required>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS_UI[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="portal-cta" disabled={saving || !effectiveRole}>
            {saving ? "..." : mode === "revoke" ? "Зняти" : "Призначити"}
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
  { value: "general", label: "Для всіх" },
  { value: "hospital", label: "Для пацієнтів" },
  { value: "staff", label: "Для працівників" },
  { value: "ads", label: "Реклама" },
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

function readSignatureImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      reject(new Error("Підпис має бути PNG, JPEG, WebP або GIF"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.onload = () => {
      const raw = String(reader.result);
      if (raw.length <= 160_000) {
        resolve(raw);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Некоректне зображення"));
      img.onload = () => {
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
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.85;
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
      img.src = raw;
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
  const [docs, setDocs] = useState<
    { name: string; data?: string; url?: string; size: number }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
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

  const onAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setMsg(null);
    void (async () => {
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        if (!isImage && visibility === "ads") {
          setMsg("Для реклами документи не додаються");
          continue;
        }
        if (isImage) {
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
          continue;
        }
        if (docs.length >= DOCS_MAX) {
          setMsg(`Максимум ${DOCS_MAX} документів`);
          break;
        }
        try {
          const data = await readDocDataUrl(file);
          setDocs((prev) =>
            prev.length < DOCS_MAX
              ? [...prev, { name: file.name, data, size: Math.round((data.length * 3) / 4) }]
              : prev,
          );
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Не вдалося прочитати документ");
        }
      }
    })();
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
    setDocs([]);
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
      documents:
        type === "regular" && visibility !== "ads"
          ? docs.map((d) =>
              d.data
                ? { name: d.name, data: d.data }
                : { name: d.name, url: d.url ?? "", size: d.size },
            )
          : [],
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
      documents: item.documents.map((d) => ({ name: d.name, url: d.url, size: d.size })),
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
    setDocs(item.documents.map((d) => ({ name: d.name, url: d.url, size: d.size })));
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
              <span className="apps-field__label">
                Короткий опис (для картки) — {summary.length}/{SUMMARY_MAX}
              </span>
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
                Додати файли
                <input
                  type="file"
                  accept={
                    visibility === "ads"
                      ? "image/*"
                      : "image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                  }
                  multiple
                  onChange={(e) => void onAddFiles(e)}
                  hidden
                  disabled={attachments >= ATTACHMENTS_MAX && docs.length >= DOCS_MAX}
                />
              </label>
              {images.map((img, i) => (
                <span
                  key={i}
                  className="cabinet-ann-img cabinet-ann-img--preview"
                  onClick={() => setLightbox(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setLightbox(i);
                  }}
                >
                  <img src={img} alt={`Зображення ${i + 1}`} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages((prev) => prev.filter((_, j) => j !== i));
                    }}
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
              {visibility !== "ads" &&
                docs.map((d, i) => (
                  <span key={`d${i}`} className="cabinet-ann-doc">
                    <Icon
                      icon={
                        d.name.toLowerCase().endsWith(".pdf")
                          ? "mdi:file-pdf-box"
                          : d.name.toLowerCase().endsWith(".doc") || d.name.toLowerCase().endsWith(".docx")
                            ? "mdi:file-word-outline"
                            : "mdi:file-document-outline"
                      }
                      width={18}
                      height={18}
                    />
                    {d.name} ({formatFileSize(d.size)})
                    <button
                      type="button"
                      onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}
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

          {lightbox !== null && images.length > 0 && (
            <Lightbox
              images={images}
              index={Math.min(lightbox, images.length - 1)}
              onClose={() => setLightbox(null)}
              onIndexChange={setLightbox}
            />
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
                  {item.visibility !== "general"
                    ? `[${VISIBILITIES.find((v) => v.value === item.visibility)?.label ?? item.visibility}] `
                    : ""}
                  {item.title ? `${item.title} — ` : ""}
                  {(item.summary ?? item.text).slice(0, 80)}
                </span>
                <span className="cabinet-ann-item-actions">
                  <button
                    type="button"
                    className="cabinet-logout"
                    title={item.active ? "Вимкнути" : "Увімкнути"}
                    aria-label={item.active ? "Вимкнути" : "Увімкнути"}
                    onClick={() => void onToggle(item)}
                  >
                    <Icon icon={item.active ? "mdi:eye-off" : "mdi:eye"} width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="cabinet-logout"
                    title="Редагувати"
                    aria-label="Редагувати"
                    onClick={() => onEdit(item)}
                  >
                    <Icon icon="mdi:pencil" width={16} height={16} />
                  </button>
                  {item.type === "regular" && (
                    <button
                      type="button"
                      className="cabinet-logout"
                      title="Посилання"
                      aria-label="Посилання"
                      onClick={() => void onCopyLink(item.id)}
                    >
                      <Icon icon="mdi:link-variant" width={16} height={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="cabinet-logout"
                    title="Видалити"
                    aria-label="Видалити"
                    onClick={() => void onDelete(item.id)}
                  >
                    <Icon icon="mdi:delete" width={16} height={16} />
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

const DOC_TEXT_MAX = 60_000;

const DOC_ATTACH_MAX = 10;

const DOC_VISIBILITIES = [
  { value: "general", label: "Для всіх" },
  { value: "hospital", label: "Для пацієнтів" },
  { value: "staff", label: "Для працівників" },
] as const;

const DOC_CONSTRUCTOR_DOWN = true;

function DocumentationManage() {
  const [items, setItems] = useState<DocumentationItem[]>([]);
  const [mode, setMode] = useState<"simple" | "extended">("simple");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<string>("general");
  const [signature, setSignature] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfWanted, setPdfWanted] = useState(false);
  const [genPdf, setGenPdf] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videoLinks, setVideoLinks] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState("");
  const [docs, setDocs] = useState<
    { name: string; data?: string; url?: string; size: number }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const all = await fetchDocumentationManage();
    setItems(all.filter((d) => !d.archived));
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
    if (beforeText.endsWith(before) && afterText.startsWith(after)) {
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
      plain = plain.replace(new RegExp(`\\${before}([^*]*)\\${before}`, "g"), "$1");
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

  const insertBlock = (snippet: string) => {
    const el = areaRef.current;
    const start = el?.selectionStart ?? text.length;
    const needsBreak = start > 0 && text[start - 1] !== "\n";
    const next = text.slice(0, start) + (needsBreak ? "\n" : "") + snippet + text.slice(start);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + snippet.length + (needsBreak ? 1 : 0);
      el?.setSelectionRange(pos, pos);
    });
  };

  const resetForm = () => {
    setCategory("");
    setTitle("");
    setSummary("");
    setText("");
    setVisibility("general");
    setSignature(null);
    setPdfUrl(null);
    setPdfData(null);
    setPdfWanted(false);
    setImages([]);
    setVideoLinks([]);
    setVideoInput("");
    setDocs([]);
    setEditingId(null);
    setMsg(null);
  };

  const onAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setMsg(null);
    void (async () => {
      for (const file of files) {
        if (images.length + videoLinks.length + docs.length >= DOC_ATTACH_MAX) {
          setMsg(`Максимум ${DOC_ATTACH_MAX} вкладень сумарно`);
          break;
        }
        if (file.type.startsWith("image/")) {
          try {
            const dataUrl = await resizeAnnouncementImage(file);
            setImages((prev) =>
              prev.length + videoLinks.length + docs.length < DOC_ATTACH_MAX
                ? [...prev, dataUrl]
                : prev,
            );
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Не вдалося обробити зображення");
          }
          continue;
        }
        try {
          const data = await readDocDataUrl(file);
          setDocs((prev) =>
            images.length + videoLinks.length + prev.length < DOC_ATTACH_MAX
              ? [...prev, { name: file.name, data, size: Math.round((data.length * 3) / 4) }]
              : prev,
          );
        } catch (err) {
          setMsg(err instanceof Error ? err.message : "Не вдалося прочитати документ");
        }
      }
    })();
  };

  const onAddVideo = () => {
    const value = videoInput.trim();
    if (!value) return;
    if (!isVideoUrl(value)) {
      setMsg("Посилання має бути на YouTube або TikTok");
      return;
    }
    if (images.length + videoLinks.length + docs.length >= DOC_ATTACH_MAX) {
      setMsg(`Максимум ${DOC_ATTACH_MAX} вкладень сумарно`);
      return;
    }
    setVideoLinks((prev) => [...prev, value]);
    setVideoInput("");
    setMsg(null);
  };

  const onAddSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsg(null);
    void readSignatureImage(file)
      .then((data) => setSignature(data))
      .catch((err) => setMsg(err instanceof Error ? err.message : "Не вдалося обробити підпис"));
  };

  const onGeneratePdf = async () => {
    const el = paperRef.current;
    if (!el || genPdf) return;
    setGenPdf(true);
    setMsg(null);
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const blob = (await html2pdf()
        .set({
          margin: 0,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .output("blob")) as Blob;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Не вдалося створити PDF"));
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(blob);
      });
      setPdfData(dataUrl);
      setPdfWanted(true);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Не вдалося згенерувати PDF");
    } finally {
      setGenPdf(false);
    }
  };

  const onRemovePdf = () => {
    setPdfData(null);
    setPdfUrl(null);
    setPdfWanted(false);
  };

  const onEdit = (item: DocumentationItem) => {
    setEditingId(item.id);
    setCategory(item.category);
    setTitle(item.title);
    setSummary(item.summary);
    setText(item.text);
    setVisibility(item.visibility);
    setSignature(item.signature);
    setPdfUrl(item.pdfUrl);
    setPdfData(null);
    setPdfWanted(!!item.pdfUrl);
    if (item.pdfUrl) setMode("extended");
    setImages(item.images);
    setVideoLinks(item.videoLinks);
    setVideoInput("");
    setDocs(item.documents.map((d) => ({ name: d.name, url: d.url, size: d.size })));
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Видалити документ?")) return;
    const res = await deleteDocumentation(id);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    if (editingId === id) resetForm();
    void load();
  };

  const onArchive = async (id: string) => {
    setMsg(null);
    const res = await archiveDocumentation(id, true);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    if (editingId === id) resetForm();
    void load();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (images.length + videoLinks.length + docs.length > DOC_ATTACH_MAX) {
      setMsg(`Максимум ${DOC_ATTACH_MAX} вкладень сумарно`);
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await saveDocumentation({
      id: editingId ?? undefined,
      category: category.trim(),
      title: title.trim(),
      text,
      summary,
      signature,
      pdf: pdfWanted ? (pdfData ?? undefined) : null,
      visibility,
      images,
      videoLinks,
      documents: docs.map((d) =>
        d.data
          ? { name: d.name, data: d.data }
          : { name: d.name, url: d.url ?? "", size: d.size },
      ),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    resetForm();
    void load();
  };

  const categories = [...new Set(items.map((i) => i.category))].sort();
  const attachments = images.length + videoLinks.length + docs.length;

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">
        {editingId ? "Редагування документа" : "Конструктор документів"}
      </div>
      <div className="p-block__body">
        {DOC_CONSTRUCTOR_DOWN ? (
        <form onSubmit={onSave} className="cabinet-ann-form">
          <label className="apps-field">
            <span className="apps-field__label">Категорія</span>
            <input
              type="text"
              list="doc-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={80}
              placeholder="Наприклад: Для пацієнтів"
              required
            />
            <datalist id="doc-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Назва документа</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={REGULAR_TITLE_MAX}
              placeholder="Назва документа"
              required
            />
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Короткий опис</span>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={SUMMARY_MAX}
              placeholder="Кілька слів про зміст документа"
            />
            <span className="cabinet-ann-count">
              {summary.length}/{SUMMARY_MAX}
            </span>
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Доступ</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {DOC_VISIBILITIES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <div className="cabinet-ann-images">
            <label className="cabinet-avatar-upload">
              Додати файли
              <input
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={(e) => void onAddFiles(e)}
                hidden
                disabled={attachments >= DOC_ATTACH_MAX}
              />
            </label>
            {images.map((img, i) => (
              <span
                key={i}
                className="cabinet-ann-img cabinet-ann-img--preview"
                onClick={() => setLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setLightbox(i);
                }}
              >
                <img src={img} alt={`Зображення ${i + 1}`} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImages((prev) => prev.filter((_, j) => j !== i));
                  }}
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
            {docs.map((d, i) => (
              <span key={`d${i}`} className="cabinet-ann-doc">
                <Icon
                  icon={
                    d.name.toLowerCase().endsWith(".pdf")
                      ? "mdi:file-pdf-box"
                      : d.name.toLowerCase().endsWith(".doc") ||
                          d.name.toLowerCase().endsWith(".docx")
                        ? "mdi:file-word-outline"
                        : d.name.toLowerCase().endsWith(".xls") ||
                            d.name.toLowerCase().endsWith(".xlsx")
                          ? "mdi:file-excel-outline"
                          : "mdi:file-document-outline"
                  }
                  width={18}
                  height={18}
                />
                {d.name} ({formatFileSize(d.size)})
                <button
                  type="button"
                  onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Прибрати"
                >
                  ×
                </button>
              </span>
            ))}
            <span className="cabinet-ann-count">
              {attachments}/{DOC_ATTACH_MAX} вкладень
            </span>
          </div>

          {lightbox !== null && images.length > 0 && (
            <Lightbox
              images={images}
              index={Math.min(lightbox, images.length - 1)}
              onClose={() => setLightbox(null)}
              onIndexChange={setLightbox}
            />
          )}

          <div className="cabinet-ann-actions">
            <button type="submit" className="portal-cta" disabled={saving}>
              {saving ? "..." : editingId ? "Оновити" : "Створити"}
            </button>
            {editingId && (
              <button type="button" className="cabinet-logout" onClick={resetForm}>
                Скасувати
              </button>
            )}
          </div>
        </form>
        ) : (
        <form onSubmit={onSave} className="cabinet-ann-form">
          <div className="cabinet-ann-mode">
            <button
              type="button"
              className={mode === "simple" ? "is-active" : ""}
              onClick={() => setMode("simple")}
            >
              Простий
            </button>
            <button
              type="button"
              className={mode === "extended" ? "is-active" : ""}
              onClick={() => setMode("extended")}
            >
              Розширений
            </button>
          </div>

          <label className="apps-field">
            <span className="apps-field__label">Категорія</span>
            <input
              type="text"
              list="doc-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={80}
              placeholder="Наприклад: Для пацієнтів"
              required
            />
            <datalist id="doc-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Назва документа</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Назва документа"
              required
            />
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Короткий опис</span>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={300}
              placeholder="Кілька слів про зміст документа (не обов'язково)"
            />
          </label>

          <label className="apps-field">
            <span className="apps-field__label">Доступ</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {DOC_VISIBILITIES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

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
            <button type="button" onClick={() => insertBlock("## ")} title="Заголовок">
              H
            </button>
            <button type="button" onClick={() => insertBlock("- ")} title="Список">
              •
            </button>
            <button type="button" onClick={() => insertBlock("1. ")} title="Нумерований список">
              1.
            </button>
            <span className="cabinet-ann-count">{text.length}/{DOC_TEXT_MAX}</span>
          </div>

          <textarea
            ref={areaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={DOC_TEXT_MAX}
            rows={12}
            placeholder="Текст документа..."
            required
          />

          <div className="cabinet-ann-images">
            <label className="cabinet-avatar-upload">
              Додати файли
              <input
                type="file"
                accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={(e) => void onAddFiles(e)}
                hidden
                disabled={attachments >= DOC_ATTACH_MAX}
              />
            </label>
            {images.map((img, i) => (
              <span
                key={i}
                className="cabinet-ann-img cabinet-ann-img--preview"
                onClick={() => setLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setLightbox(i);
                }}
              >
                <img src={img} alt={`Зображення ${i + 1}`} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImages((prev) => prev.filter((_, j) => j !== i));
                  }}
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
            {docs.map((d, i) => (
              <span key={`d${i}`} className="cabinet-ann-doc">
                <Icon
                  icon={
                    d.name.toLowerCase().endsWith(".pdf")
                      ? "mdi:file-pdf-box"
                      : d.name.toLowerCase().endsWith(".doc") ||
                          d.name.toLowerCase().endsWith(".docx")
                        ? "mdi:file-word-outline"
                        : d.name.toLowerCase().endsWith(".xls") ||
                            d.name.toLowerCase().endsWith(".xlsx")
                          ? "mdi:file-excel-outline"
                          : "mdi:file-document-outline"
                  }
                  width={18}
                  height={18}
                />
                {d.name} ({formatFileSize(d.size)})
                <button
                  type="button"
                  onClick={() => setDocs((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Прибрати"
                >
                  ×
                </button>
              </span>
            ))}
            {attachments < DOC_ATTACH_MAX && (
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

          {lightbox !== null && images.length > 0 && (
            <Lightbox
              images={images}
              index={Math.min(lightbox, images.length - 1)}
              onClose={() => setLightbox(null)}
              onIndexChange={setLightbox}
            />
          )}

          {mode === "extended" && (
            <div className="cabinet-ann-gen">
              <label className="cabinet-avatar-upload">
                Підпис (зображення)
                <input type="file" accept="image/*" onChange={onAddSignature} hidden />
              </label>
              {signature && (
                <button
                  type="button"
                  className="cabinet-logout"
                  onClick={() => setSignature(null)}
                >
                  Прибрати підпис
                </button>
              )}
              <button
                type="button"
                className="cabinet-logout"
                onClick={() => void onGeneratePdf()}
                disabled={genPdf || !text.trim()}
              >
                {genPdf ? "Генерація..." : pdfUrl || pdfData ? "Оновити PDF" : "Згенерувати PDF"}
              </button>
              {(pdfUrl || pdfData) && (
                <span className="cabinet-ann-pdf-state">
                  {pdfData ? "PDF буде збережено разом із документом" : "PDF збережено"}
                  <button type="button" className="cabinet-logout" onClick={onRemovePdf}>
                    Прибрати PDF
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="cabinet-ann-preview">
            <span className="apps-field__label">Попередній перегляд</span>
            <div className="doc-paper" ref={paperRef}>
              <div className="doc-paper__title">{title || "Назва документа"}</div>
              <div className="ann-md doc-paper__body">
                {renderMiniMarkdown(text || "Текст документа...")}
              </div>
              {mode === "extended" && (
                <div className="doc-paper__sign">
                  {signature ? (
                    <img src={signature} alt="Підпис" />
                  ) : (
                    <span className="doc-paper__sign-line" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="cabinet-ann-actions">
            <button type="submit" className="portal-cta" disabled={saving}>
              {saving ? "..." : editingId ? "Оновити" : "Створити"}
            </button>
            {editingId && (
              <button type="button" className="cabinet-logout" onClick={resetForm}>
                Скасувати
              </button>
            )}
          </div>
        </form>
        )}
        {msg && <p className="cabinet-profile-error">{msg}</p>}
        <ul className="cabinet-apps" style={{ marginTop: "0.8rem" }}>
          {items.map((item) => (
            <li key={item.id} className="cabinet-apps__item">
              <div className="cabinet-apps__head">
                <span style={{ fontSize: "0.85rem" }}>
                  [{item.category}]
                  {item.visibility !== "general"
                    ? ` [${DOC_VISIBILITIES.find((v) => v.value === item.visibility)?.label ?? item.visibility}]`
                    : ""}{" "}
                  {item.title}
                </span>
                <span className="cabinet-ann-item-actions">
                  <button
                    type="button"
                    className="cabinet-logout"
                    title="Редагувати"
                    aria-label="Редагувати"
                    onClick={() => onEdit(item)}
                  >
                    <Icon icon="mdi:pencil" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="cabinet-logout"
                    title="Архівувати"
                    aria-label="Архівувати"
                    onClick={() => void onArchive(item.id)}
                  >
                    <Icon icon="mdi:archive-arrow-down" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="cabinet-logout"
                    title="Видалити"
                    aria-label="Видалити"
                    onClick={() => void onDelete(item.id)}
                  >
                    <Icon icon="mdi:delete" width={16} height={16} />
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

function ArchivePanel() {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [docs, setDocs] = useState<DocumentationItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [anns, allDocs] = await Promise.all([fetchArchive(), fetchDocumentationManage()]);
    setAnnouncements(anns);
    setDocs(allDocs.filter((d) => d.archived));
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRestore = async (id: string) => {
    setBusyId(id);
    setMsg(null);
    const res = await archiveDocumentation(id, false);
    setBusyId(null);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    void load();
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Видалити документ з архіву назавжди?")) return;
    setBusyId(id);
    setMsg(null);
    const res = await deleteDocumentation(id);
    setBusyId(null);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    void load();
  };

  return (
    <>
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Оголошення в архіві</div>
        <div className="p-block__body">
          <p className="cabinet-profile-note">
            Оголошення старші за 60 днів приховуються зі стрічки автоматично.
            Терміни консервації не змінюються.
          </p>
          {!loaded ? (
            <p className="cabinet-profile-note">Завантаження...</p>
          ) : announcements.length === 0 ? (
            <p className="cabinet-profile-note">Архівних оголошень немає.</p>
          ) : (
            <ul className="cabinet-apps">
              {announcements.map((a) => (
                <li key={a.id} className="cabinet-apps__item">
                  <div className="cabinet-apps__head">
                    <span>{a.title || a.summary || a.text.slice(0, 70)}</span>
                  </div>
                  <div className="cabinet-apps__date">
                    {fmtDate(a.createdAt)} · {a.visibility}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Документи в архіві</div>
        <div className="p-block__body">
          <p className="cabinet-profile-note">
            Архівні документи приховані з публічного списку. «Повернути» робить
            документ знову видимим, «Видалити» прибирає його назавжди разом із
            вкладеннями.
          </p>
          {msg && <p className="cabinet-profile-error">{msg}</p>}
          {!loaded ? (
            <p className="cabinet-profile-note">Завантаження...</p>
          ) : docs.length === 0 ? (
            <p className="cabinet-profile-note">Архівних документів немає.</p>
          ) : (
            <ul className="cabinet-apps">
              {docs.map((item) => (
                <li key={item.id} className="cabinet-apps__item">
                  <div className="cabinet-apps__head">
                    <span style={{ fontSize: "0.85rem" }}>
                      [{item.category}] {item.title}
                    </span>
                    <span className="cabinet-ann-item-actions">
                      <button
                        type="button"
                        className="cabinet-logout"
                        disabled={busyId === item.id}
                        title="Повернути"
                        aria-label="Повернути"
                        onClick={() => void onRestore(item.id)}
                      >
                        <Icon icon="mdi:restore" width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="cabinet-logout"
                        disabled={busyId === item.id}
                        title="Видалити"
                        aria-label="Видалити"
                        onClick={() => void onDelete(item.id)}
                      >
                        <Icon icon="mdi:delete" width={16} height={16} />
                      </button>
                    </span>
                  </div>
                  <div className="cabinet-apps__date">{fmtDate(item.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export function PanelPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PanelTab>("overview");
  const [focusApp, setFocusApp] = useState<string | null>(null);

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
  if (canManageAnn) tabs.push({ id: "constructor", label: "Оголошення" });
  if (canManageAnn) tabs.push({ id: "docs", label: "Документація" });
  if (canManageAnn) tabs.push({ id: "archive", label: "Архів" });
  if (isAssigner) tabs.push({ id: "roles", label: "Управління" });
  if (isSysadmin) tabs.push({ id: "users", label: "Адміністрування" });

  const tabIds = tabs.map((t) => t.id).join(",");

  useEffect(() => {
    if (!tabIds) return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const appId = params.get("app");
    if (tabParam && tabIds.split(",").includes(tabParam)) {
      setTab(tabParam as PanelTab);
    }
    if (appId) setFocusApp(appId);
  }, [tabIds]);

  const allowed = tabs.some((t) => t.id === tab);
  const activeTab = allowed ? tab : "overview";

  return (
    <PortalLayout title="Панель працівника">
      {loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : !user || tabs.length === 0 ? (
        <div className="p-block">
          <div className="p-block__head">
            {user ? "Немає доступних розділів" : "Доступ обмежено"}
          </div>
          <div className="p-block__body">
            <p className="cabinet-profile-note">
              {user
                ? "Для вашого акаунта ще не призначено жодного розділу панелі."
                : "Ця сторінка доступна працівникам лікарні. Увійдіть через Google під обліковим записом з відповідною посадою."}
            </p>
            <Link to="/kabinet" className="portal-cta">
              Перейти в кабінет
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="cabinet-tabs" style={{ marginBottom: "1rem" }}>
            <button
              type="button"
              className={`cabinet-tab${activeTab === "overview" ? " cabinet-tab--on" : ""}`}
              onClick={() => setTab("overview")}
            >
              Огляд
            </button>
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
          {activeTab === "overview" && (
            <div className="p-block">
              <div className="p-block__head p-block__head--teal">Огляд</div>
              <div className="p-block__body">
                <div className="panel-overview__grid">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="panel-tile"
                      onClick={() => setTab(t.id)}
                    >
                      <Icon
                        icon={TAB_ICONS[t.id]}
                        width={26}
                        height={26}
                        className="panel-tile__icon"
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === "appeals" && (
            <ReviewPanel kind="appeals" user={user} focusId={focusApp} />
          )}
          {activeTab === "jobs" && (
            <ReviewPanel kind="jobs" user={user} focusId={focusApp} />
          )}
          {activeTab === "callcenter" && (
            <AppointmentsQueue user={user} focusId={focusApp} />
          )}
          {activeTab === "constructor" && <AnnouncementsManage />}
          {activeTab === "docs" && <DocumentationManage />}
          {activeTab === "archive" && <ArchivePanel />}
          {activeTab === "roles" && <RolesPanel />}
          {activeTab === "users" && <UsersBanPanel />}
        </>
      )}
    </PortalLayout>
  );
}


function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.endsWith("Z") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
}

type UsersSortKey =
  | "name"
  | "email"
  | "roles"
  | "ip"
  | "device"
  | "created"
  | "seen"
  | "status";

function userStatusKey(u: AdminUserItem): "banned" | "temp" | "active" {
  if (u.banned) return "banned";
  if (
    u.blockedUntil &&
    new Date(u.blockedUntil + (u.blockedUntil.endsWith("Z") ? "" : "Z")) > new Date()
  ) {
    return "temp";
  }
  return "active";
}

function withinDays(iso: string | null, days: number): boolean {
  if (!iso) return false;
  const d = new Date(iso.endsWith("Z") ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= days * 86400000;
}

function PanelAppointmentChat({
  appointment,
  onChanged,
  onProfile,
  onStatus,
  user,
}: {
  appointment: AppointmentItem;
  onChanged: () => void;
  onProfile?: () => void;
  onStatus: (status: string, needNote?: boolean) => void;
  user: PublicUser | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<{ name: string; data: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoOn, setVideoOn] = useState(false);
  const [closedLocal, setClosedLocal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const terminal = appointment.status === "accepted" || appointment.status === "rejected";

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm("Видалити це повідомлення?")) return;
    setErr(null);
    const res = await deleteAppointmentMessage(appointment.id, messageId);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEditingMessageId(null);
    await loadMessages();
    onChanged();
  };

  const saveEditedMessage = async (messageId: string) => {
    const body = editingText.trim();
    if (!body) {
      setErr("Повідомлення не може бути порожнім");
      return;
    }
    setErr(null);
    const res = await updateAppointmentMessage(appointment.id, messageId, body);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEditingMessageId(null);
    setEditingText("");
    await loadMessages();
    onChanged();
  };
  const dialogueClosed = !!appointment.dialogueClosedAt || closedLocal;

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetchAppointmentMessages(appointment.id);
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
      if (res?.dialogueClosed) setClosedLocal(true);
    } catch {
      setMessages([]);
      setErr("Не вдалося завантажити історію діалогу.");
    }
  }, [appointment.id]);

  useEffect(() => {
    if (!open) return;
    void loadMessages();
    const t = window.setInterval(() => void loadMessages(), 2000);
    return () => window.clearInterval(t);
  }, [open, loadMessages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const video = videoUrl.trim();
    const body = text.trim();
    if (!body && !file && !video && !doc) return;
    if (video && !/^https?:\/\//i.test(video)) {
      setErr("Некоректне посилання на відео");
      return;
    }
    setErr(null);
    setSending(true);
    let imageUrl: string | undefined;
    if (file) {
      try {
        imageUrl = await compressImageForChat(file);
      } catch {
        setSending(false);
        setErr("Не вдалося обробити зображення");
        return;
      }
    }
    const res = await sendAppointmentMessage(
      appointment.id,
      body,
      imageUrl,
      video || undefined,
      doc ?? undefined,
    );
    setSending(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setText("");
    setFile(null);
    setDoc(null);
    setVideoUrl("");
    await loadMessages();
  };

  const showDecisionButtons = !terminal && !open;
  const decisionGate = useRef(0);

  useLayoutEffect(() => {
    if (showDecisionButtons) decisionGate.current = Date.now() + 400;
  }, [showDecisionButtons]);

  const decide = (status: string) => {
    if (Date.now() < decisionGate.current) return;
    onStatus(status, true);
  };

  const onStartDialogue = async () => {
    if (Date.now() < decisionGate.current) return;
    setErr(null);
    const res = await setAppointmentStatus(appointment.id, "dialogue");
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setOpen(true);
    onChanged();
  };

  const onCloseDialogue = async () => {
    if (!window.confirm("Завершити діалог? Повторно відкрити його не можна.")) return;
    setErr(null);
    const res = await closeAppointmentDialogue(appointment.id);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setClosedLocal(true);
    onChanged();
  };

  return (
    <>
      {!terminal && !open && (
        <div className="cabinet-review-actions" style={{ marginBottom: "0.5rem" }}>
          <button
            type="button"
            className="cabinet-action cabinet-action--ok"
            onClick={() => decide("accepted")}
          >
            Прийняти
          </button>
          <button
            type="button"
            className="cabinet-action cabinet-action--no"
            onClick={() => decide("rejected")}
          >
            Відхилити
          </button>
          {appointment.status === "in_progress" && (
            <button
              type="button"
              className="cabinet-action cabinet-action--dialogue"
              onClick={onStartDialogue}
            >
              Почати діалог
            </button>
          )}
          {appointment.status === "dialogue" && !dialogueClosed && (
            <button
              type="button"
              className="cabinet-action cabinet-action--dialogue"
              onClick={() => setOpen(true)}
            >
              Діалог
            </button>
          )}
        </div>
      )}
      {!terminal && !dialogueClosed && appointment.status === "dialogue" && (
        <button
          type="button"
          className="cabinet-action cabinet-action--no"
          onClick={() => void onCloseDialogue()}
        >
          Завершити діалог
        </button>
      )}
      {err && <p className="cabinet-profile-error">{err}</p>}
      {dialogueClosed && !terminal && (
        <div className="cabinet-apps__note">Діалог завершено</div>
      )}
      {(terminal || dialogueClosed) && !open && (
        <button
          type="button"
          className="cabinet-action cabinet-action--dialogue"
          onClick={() => setOpen(true)}
        >
          Історія діалогу
        </button>
      )}
      {open && (
        <div className="chat-modal-overlay" onClick={() => setOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal__head">
              <strong>Діалог — запис на прийом</strong>
              <button
                type="button"
                className="profile-modal__close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="chat-modal__body">
          <ul className="cabinet-chat__list">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`cabinet-chat__msg${m.isReviewer ? " cabinet-chat__msg--staff" : " cabinet-chat__msg--user"}`}
              >
                <span
                  className={`cabinet-chat__author${!m.isReviewer && onProfile ? " author-link" : ""}`}
                  onClick={!m.isReviewer && onProfile ? onProfile : undefined}
                >
                  {m.senderName}
                </span>
                {editingMessageId === m.id ? (
                  <div className="cabinet-chat__edit">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      maxLength={2000}
                    />
                    <div className="cabinet-chat__edit-actions">
                      <button type="button" className="portal-cta" onClick={() => void saveEditedMessage(m.id)}>
                        Зберегти
                      </button>
                      <button type="button" className="cabinet-action cabinet-action--no" onClick={() => {
                        setEditingMessageId(null);
                        setEditingText("");
                      }}>
                        Скасувати
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.body && <p>{m.body}</p>}
                    {m.imageUrl && (
                      <ChatImage url={m.imageUrl} />
                    )}
                    {m.videoUrl && <VideoPreview url={m.videoUrl} />}
                    {m.doc && (
                      <ChatDocCard name={m.doc.name} url={m.doc.url} size={m.doc.size} />
                    )}
                  </>
                )}
                {!terminal && !dialogueClosed && (m.senderId === user?.id || (user?.roles.includes("sysadmin") && m.isReviewer)) && (
                  <div className="cabinet-chat__actions">
                    {m.senderId === user?.id && (
                      <button
                        type="button"
                        className="cabinet-chat__action-btn"
                        onClick={() => {
                          setEditingMessageId(m.id);
                          setEditingText(m.body || "");
                        }}
                      >
                        Редагувати
                      </button>
                    )}
                    <button
                      type="button"
                      className="cabinet-chat__action-btn cabinet-chat__action-btn--danger"
                      onClick={() => void deleteMessage(m.id)}
                    >
                      Видалити
                    </button>
                  </div>
                )}
                <span className="cabinet-chat__date">
                  {new Date(m.createdAt + "Z").toLocaleString("uk-UA")}
                </span>
              </li>
            ))}
          </ul>
          {!terminal && !dialogueClosed && (
            <form onSubmit={onSend} className="cabinet-chat__form">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Написати пацієнту..."
                maxLength={2000}
              />
              <label className="cabinet-chat__attach" title="Прикріпити зображення">
                <Icon icon="mdi:image-plus" width={18} height={18} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="cabinet-chat__attach" title="Прикріпити документ (PDF, TXT, DOC, DOCX)">
                <Icon icon="mdi:file-document-plus-outline" width={18} height={18} />
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    void readDocDataUrl(f)
                      .then((data) => setDoc({ name: f.name, data }))
                      .catch((er: Error) => setErr(er.message));
                  }}
                />
              </label>
              <button
                type="button"
                className="cabinet-chat__attach"
                title="Додати відео за посиланням"
                onClick={() => setVideoOn((v) => !v)}
              >
                <Icon icon="mdi:video-outline" width={18} height={18} />
              </button>
              {file && <span className="cabinet-chat__file">{file.name}</span>}
              {doc && (
                <span className="cabinet-chat__file">
                  {doc.name} ({formatFileSize(Math.round((doc.data.length * 3) / 4))})
                  <button
                    type="button"
                    className="cabinet-chat__file-remove"
                    onClick={() => setDoc(null)}
                  >
                    <Icon icon="mdi:close-circle" width={16} height={16} />
                  </button>
                </span>
              )}
              <button type="submit" className="portal-cta" disabled={sending}>
                {sending ? "..." : "Надіслати"}
              </button>
              {videoOn && (
                <div className="cabinet-chat__video">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Посилання на відео (YouTube, TikTok)..."
                    maxLength={500}
                  />
                </div>
              )}
            </form>
          )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UsersBanPanel() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [requests, setRequests] = useState<AccountRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roleF, setRoleF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [regF, setRegF] = useState("");
  const [actF, setActF] = useState("");
  const [sortKey, setSortKey] = useState<UsersSortKey>("created");
  const [sortDir, setSortDir] = useState(-1);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditQuery, setAuditQuery] = useState("");
  const [auditActionF, setAuditActionF] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");
  const [auditActorF, setAuditActorF] = useState("");
  const [auditMsgs, setAuditMsgs] = useState(false);
  const [archives, setArchives] = useState<AuditArchiveItem[]>([]);
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [shownCodes, setShownCodes] = useState<Set<string>>(new Set());
  const [warnUser, setWarnUser] = useState<AdminUserItem | null>(null);
  const [warnItems, setWarnItems] = useState<WarningHistoryItem[]>([]);
  const [warnLoading, setWarnLoading] = useState(false);

  const allAuditActions = [...new Set([
    "application.create", "warn", "warn.block", "warning.remove", "timeout", "unblock",
    "user.ban", "user.unban", "user.delete", "user.edit_name",
    "role.assign", "role.revoke", "invite.create",
    "application.status", "application.dialogue_close", "application.message",
    "job.create", "job.status", "job.dialogue_close", "job.message",
    "appointment.create", "appointment.status", "appointment.dialogue_close",
    "appointment.message",
    "account_request.resolve",
    "documentation.create", "documentation.update", "documentation.delete",
    "documentation.archive", "documentation.restore",
  ])].sort();

  const filteredAudit = audit.filter((e) => {
    if (AUDIT_MESSAGE_ACTIONS.has(e.action) && !auditMsgs && auditActionF !== e.action) {
      return false;
    }
    const q = auditQuery.trim().toLowerCase();
    if (q && !e.action.toLowerCase().includes(q)
      && !(e.details ?? "").toLowerCase().includes(q)
      && !(e.actor?.name ?? "").toLowerCase().includes(q)
      && !(e.target?.name ?? "").toLowerCase().includes(q)) {
      return false;
    }
    if (auditActionF && e.action !== auditActionF) return false;
    if (auditActorF && (e.actor?.name ?? "") !== auditActorF) return false;
    if (auditDateFrom) {
      const from = new Date(auditDateFrom);
      if (new Date(e.createdAt) < from) return false;
    }
    if (auditDateTo) {
      const to = new Date(auditDateTo + "T23:59:59");
      if (new Date(e.createdAt) > to) return false;
    }
    return true;
  });

  const allAuditActors = [...new Set(audit.map((e) => e.actor?.name).filter(Boolean))].sort();

  const downloadAuditCsv = () => {
    const header = "Дата,Дія,Актор,Ціль,Деталі\n";
    const rows = filteredAudit.map((e) => [
      fmtDate(e.createdAt).replace(",", "."),
      AUDIT_ACTION_LABELS[e.action] ?? e.action,
      e.actor?.name ?? "Система",
      e.target?.name ?? "",
      (e.details ?? "").replace(/"/g, '""').replace(/\n/g, " "),
    ].map((v) => `"${v}"`).join(","));
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const load = useCallback(async () => {
    const [list, reqs, auditLog, archiveList, emailList] = await Promise.all([
      fetchAdminUsers(),
      fetchAccountRequests(),
      fetchAuditLog(),
      fetchAuditArchives(),
      fetchEmailLog(),
    ]);
    setUsers(list);
    setRequests(reqs.filter((r) => r.status === "pending"));
    setAudit(auditLog);
    setArchives(archiveList);
    setEmails(emailList);
    setErr(list.length ? null : "Не вдалося завантажити користувачів");
    setLoading(false);
    const me = await fetchMe();
    setMeId(me?.id ?? null);
  }, []);

  const openWarnings = async (u: AdminUserItem) => {
    setWarnUser(u);
    setWarnLoading(true);
    setWarnItems(await fetchUserWarnings(u.id));
    setWarnLoading(false);
  };

  const onDownloadArchive = async (month: string) => {
    const res = await downloadAuditArchive(month);
    if (!res.ok) setErr(res.error);
  };

  const removeWarning = async (warningId: string) => {
    if (!warnUser) return;
    if (!window.confirm("Зняти це попередження?")) return;
    const res = await adminUserAction(warnUser.id, "remove_warning", { warningId });
    if (!res.ok) {
      setErr(res.error ?? "Не вдалося зняти попередження");
      return;
    }
    setWarnItems((items) => items.filter((item) => item.id !== warningId));
    await load();
  };

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

  const onEditName = async (u: AdminUserItem) => {
    const last = window.prompt("Прізвище:", u.lastName ?? "");
    if (last === null) return;
    const first = window.prompt("Ім'я:", u.firstName ?? "");
    if (first === null) return;
    const patr = window.prompt("По батькові:", u.patronymic ?? "");
    if (patr === null) return;
    const payload = {
      lastName: last.trim(),
      firstName: first.trim(),
      patronymic: patr.trim(),
    };
    if (!payload.lastName || !payload.firstName || !payload.patronymic) {
      setErr("ПІБ не може бути порожнім");
      return;
    }
    await run(u.id, () => adminUserAction(u.id, "edit_name", payload));
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
    const raw = window.prompt("Причина / коментар (необов'язково):");
    if (raw === null) return;
    const note = raw.trim() || undefined;
    await run(req.userId, () => resolveAccountRequest(req.id, done, note));
  };

  const needle = query.trim().toLowerCase();
  const visible = users
    .filter((u) => {
      if (
        needle &&
        !u.name.toLowerCase().includes(needle) &&
        !(u.email ?? "").toLowerCase().includes(needle) &&
        !(u.lastIp ?? "").toLowerCase().includes(needle) &&
        !formatIp(u.lastIp).toLowerCase().includes(needle)
      ) {
        return false;
      }
      if (roleF && !u.roles.includes(roleF)) return false;
      if (statusF && userStatusKey(u) !== statusF) return false;
      if (regF && !withinDays(u.createdAt, Number(regF))) return false;
      if (actF === "never") return !u.lastSeen;
      if (actF && !withinDays(u.lastSeen, Number(actF))) return false;
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir;
      switch (sortKey) {
        case "name":
          return dir * a.name.localeCompare(b.name, "uk");
        case "email":
          return dir * (a.email ?? "").localeCompare(b.email ?? "", "uk");
        case "roles":
          return dir * a.roles.join(", ").localeCompare(b.roles.join(", "), "uk");
        case "ip":
          return dir * formatIp(a.lastIp).localeCompare(formatIp(b.lastIp), "uk");
        case "device":
          return dir * formatUaShort(a.lastUa).localeCompare(formatUaShort(b.lastUa), "uk");
        case "seen":
          return dir * (a.lastSeen ?? "").localeCompare(b.lastSeen ?? "");
        case "status":
          return dir * userStatusKey(a).localeCompare(userStatusKey(b));
        default:
          return dir * a.createdAt.localeCompare(b.createdAt);
      }
    });

  const allRoles = [...new Set(users.flatMap((u) => u.roles))].sort();

  const toggleSort = (key: UsersSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => -d);
      return;
    }
    setSortKey(key);
    setSortDir(key === "created" || key === "seen" ? -1 : 1);
  };

  const sortArrow = (key: UsersSortKey) =>
    sortKey === key ? (sortDir === 1 ? " ▲" : " ▼") : "";

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
          <p className="cabinet-profile-note">
            Завантажено користувачів: {users.length}. Пошук, фільтри та сортування — у
            повноекранній таблиці.
          </p>
          <button
            type="button"
            className="cabinet-action cabinet-action--review"
            onClick={() => setTableOpen(true)}
          >
            Відкрити таблицю користувачів
          </button>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Журнал дій</div>
        <div className="p-block__body">
          <div className="audit-toolbar">
            <input
              type="search"
              className="audit-toolbar__search"
              placeholder="Пошук: дія, актор, ціль, деталі..."
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
            />
            <label className="audit-toolbar__filter">
              Дія
              <select value={auditActionF} onChange={(e) => setAuditActionF(e.target.value)}>
                <option value="">Усі дії</option>
                {allAuditActions.map((a) => (
                  <option key={a} value={a}>
                    {AUDIT_ACTION_LABELS[a] ?? a}
                  </option>
                ))}
              </select>
            </label>
            <label className="audit-toolbar__filter">
              Актор
              <select value={auditActorF} onChange={(e) => setAuditActorF(e.target.value)}>
                <option value="">Усі актори</option>
                {allAuditActors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="audit-toolbar__filter">
              Від
              <input type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} />
            </label>
            <label className="audit-toolbar__filter">
              До
              <input type="date" value={auditDateTo} onChange={(e) => setAuditDateTo(e.target.value)} />
            </label>
            <label className="audit-toolbar__filter audit-toolbar__check">
              <input
                type="checkbox"
                checked={auditMsgs}
                onChange={(e) => setAuditMsgs(e.target.checked)}
              />
              Повідомлення
            </label>
            <button
              type="button"
              className="cabinet-logout"
              onClick={downloadAuditCsv}
              title="Експорт CSV"
            >
              <Icon icon="mdi:download" width={15} height={15} />
            </button>
          </div>
          {filteredAudit.length === 0 ? (
            <p className="cabinet-profile-note">Записів немає.</p>
          ) : (
            <ul className="audit-list">
              {filteredAudit.map((e) => (
                <li key={e.id} className="audit-list__item">
                  <span className="audit-list__date">{fmtDate(e.createdAt)}</span>
                  <span className="audit-list__action">
                    {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                  </span>
                  <span className="audit-list__actor">{e.actor?.name ?? "Система"}</span>
                  {e.target && <span className="audit-list__target">→ {e.target.name}</span>}
                  {e.details && <span className="audit-list__details">{e.details}</span>}
                </li>
              ))}
            </ul>
          )}

          <div className="audit-archives">
            <div className="cabinet-settings__group">Місячні архіви (48 годин)</div>
            {archives.length === 0 ? (
              <p className="cabinet-profile-note">
                Архівів поки що немає. Попередні місяці архівуються автоматично після
                1-го числа.
              </p>
            ) : (
              <ul className="audit-list">
                {archives.map((a) => (
                  <li key={a.month} className="audit-list__item">
                    <span className="audit-list__date">{a.month}</span>
                    <span className="audit-list__action">{a.entries} записів</span>
                    <span className="audit-list__actor">
                      {Math.max(1, Math.round(a.size / 1024))} КБ
                    </span>
                    {a.available ? (
                      <button
                        type="button"
                        className="cabinet-logout"
                        onClick={() => void onDownloadArchive(a.month)}
                      >
                        <Icon icon="mdi:download" width={15} height={15} />
                      </button>
                    ) : (
                      <span className="audit-list__details">
                        Термін завантаження минув (48 годин)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Останні листи</div>
        <div className="p-block__body">
          <p className="cabinet-profile-note">
            Останні 50 листів: кому, тема, провайдер і чи дійшло повідомлення.
            Код підтвердження приховано — натисніть, щоб показати.
          </p>
          {emails.length === 0 ? (
            <p className="cabinet-profile-note">Листів ще немає.</p>
          ) : (
            <ul className="audit-list">
              {emails.map((m) => (
                <li key={m.id} className="audit-list__item">
                  <span className="audit-list__date">{fmtDate(m.createdAt)}</span>
                  <span className="audit-list__action">{m.subject}</span>
                  <span className="audit-list__actor">{m.email}</span>
                  <span className="audit-list__target">
                    {m.ok ? `Надіслано · ${m.via ?? "—"}` : "Не надіслано"}
                  </span>
                  {!m.ok && m.error && (
                    <span className="audit-list__details">{m.error}</span>
                  )}
                  {m.code && (
                    <button
                      type="button"
                      className="cabinet-logout"
                      title="Показати код"
                      onClick={() =>
                        setShownCodes((prev) => {
                          const next = new Set(prev);
                          if (next.has(m.id)) next.delete(m.id);
                          else next.add(m.id);
                          return next;
                        })
                      }
                    >
                      {shownCodes.has(m.id) ? m.code : "••••••"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {tableOpen && (
        <div className="users-modal-overlay" onClick={() => setTableOpen(false)}>
          <div className="users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal__head">
              <strong>
                Користувачі — {visible.length} / {users.length}
              </strong>
              <button
                type="button"
                className="profile-modal__close"
                onClick={() => setTableOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="users-modal__toolbar">
              <input
                type="search"
                className="users-modal__search"
                placeholder="Пошук: ПІБ, Email, IP..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="users-modal__filter">
                Посада
                <select value={roleF} onChange={(e) => setRoleF(e.target.value)}>
                  <option value="">Усі</option>
                  {allRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS_UI[r] ?? r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="users-modal__filter">
                Статус
                <select value={statusF} onChange={(e) => setStatusF(e.target.value)}>
                  <option value="">Усі</option>
                  <option value="active">Активний</option>
                  <option value="temp">Тимчасово</option>
                  <option value="banned">Заблоковано</option>
                </select>
              </label>
              <label className="users-modal__filter">
                Реєстрація
                <select value={regF} onChange={(e) => setRegF(e.target.value)}>
                  <option value="">За весь час</option>
                  <option value="1">За добу</option>
                  <option value="7">За тиждень</option>
                  <option value="30">За місяць</option>
                  <option value="365">За рік</option>
                </select>
              </label>
              <label className="users-modal__filter">
                Активність
                <select value={actF} onChange={(e) => setActF(e.target.value)}>
                  <option value="">За весь час</option>
                  <option value="1">За добу</option>
                  <option value="7">За тиждень</option>
                  <option value="30">За місяць</option>
                  <option value="never">Ніколи</option>
                </select>
              </label>
              <button
                type="button"
                className="cabinet-logout"
                onClick={() => {
                  setQuery("");
                  setRoleF("");
                  setStatusF("");
                  setRegF("");
                  setActF("");
                }}
              >
                Скинути
              </button>
            </div>
            <div className="users-modal__scroll">
              <table className="panel-users">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("name")}>ПІБ{sortArrow("name")}</th>
                    <th onClick={() => toggleSort("email")}>Email{sortArrow("email")}</th>
                    <th onClick={() => toggleSort("roles")}>Посади{sortArrow("roles")}</th>
                    <th onClick={() => toggleSort("ip")}>IP · Країна{sortArrow("ip")}</th>
                    <th onClick={() => toggleSort("device")}>
                      Пристрій{sortArrow("device")}
                    </th>
                    <th onClick={() => toggleSort("created")}>
                      Реєстрація{sortArrow("created")}
                    </th>
                    <th onClick={() => toggleSort("seen")}>
                      Активність{sortArrow("seen")}
                    </th>
                    <th onClick={() => toggleSort("status")}>
                      Статус{sortArrow("status")}
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => (
                    <tr key={u.id} className={u.banned ? "panel-users__row--banned" : undefined}>
                      <td>
                        <span
                          className="author-link"
                          onClick={() =>
                            setProfileUser({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              age: u.age,
                              registeredAt: u.createdAt,
                              bio: u.bio,
                              specialization: u.specialization,
                              avatar: u.avatar,
                              roles: u.roles,
                              discordUsername: u.discordUsername,
                              robloxUsername: u.robloxUsername,
                            })
                          }
                        >
                          {u.name}
                        </span>
                      </td>
                    <td>{u.email ?? "—"}</td>
                    <td>{u.roles.join(", ") || "—"}</td>
                    <td className="panel-users__ip" title={u.lastIp ?? ""}>
                      {u.lastIp ? formatIp(u.lastIp) : "—"}
                      {u.lastCountry ? ` · ${formatCountry(u.lastCountry)}` : ""}
                    </td>
                    <td title={u.lastUa ?? ""}>{formatUaShort(u.lastUa)}</td>
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
                        <button
                          type="button"
                          className="cabinet-logout"
                          disabled={busyId === u.id}
                          title="Змінити ПІБ"
                          onClick={() => void onEditName(u)}
                        >
                          <Icon icon="mdi:pencil" width={15} height={15} />
                        </button>
                        <button
                          type="button"
                          className="cabinet-logout"
                          title="Історія попереджень"
                          onClick={() => void openWarnings(u)}
                        >
                          <Icon icon="mdi:history" width={15} height={15} />
                        </button>
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
                              title="Тимчасове блокування"
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
              {visible.length === 0 && (
                <p className="cabinet-profile-note">Нічого не знайдено.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {warnUser && (
        <div className="chat-modal-overlay" onClick={() => setWarnUser(null)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-modal__head">
              <strong>Історія попереджень — {warnUser.name}</strong>
              <button
                type="button"
                className="profile-modal__close"
                onClick={() => setWarnUser(null)}
              >
                ×
              </button>
            </div>
            <div className="chat-modal__body">
              {warnLoading ? (
                <p className="cabinet-profile-note">Завантаження...</p>
              ) : warnItems.length === 0 ? (
                <p className="cabinet-profile-note">Попереджень ще не було.</p>
              ) : (
                <ul className="audit-list">
                  {warnItems.map((w) => (
                    <li key={w.id} className="audit-list__item">
                      <span className="audit-list__date">{fmtDate(w.createdAt)}</span>
                      <span className="audit-list__action">
                        {w.kind === "warn"
                          ? "Попередження"
                          : w.kind === "warn_block"
                            ? "Попередження (з блокуванням)"
                            : w.kind === "timeout"
                              ? "Тимчасове блокування"
                              : w.kind}
                      </span>
                      <span className="audit-list__actor">{w.issuedBy?.name ?? "—"}</span>
                      {w.reason && <span className="audit-list__details">{w.reason}</span>}
                      <button
                        type="button"
                        className="cabinet-chat__action-btn cabinet-chat__action-btn--danger"
                        onClick={() => void removeWarning(w.id)}
                      >
                        Зняти
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {profileUser && (
        <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}
    </>
  );
}
