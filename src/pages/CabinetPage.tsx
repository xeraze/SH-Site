import { useCallback, useEffect, useRef, useState } from "react";
import {
  acceptInvite,
  createAppointment,
  emailChangeStart,
  emailChangeVerify,
  fetchAppointments,
  fetchApplications,
  fetchMe,
  fetchMessages,
  fetchNotifications,
  getToken,
  loginPassword,
  loginUrl,
  logout,
  markNotificationsRead,
  registerStart,
  registerVerify,
  saveProfile,
  saveSettings,
  sendMessage,
  setPassword,
  setToken,
  type AppointmentItem,
  type ApplicationItem,
  type DialogueMessage,
  type NotificationItem,
  type PublicUser,
} from "../api";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import "./CabinetPage.css";

function readHashToken(): string | null {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("token=")) return null;
  return hash.slice("token=".length);
}

function RoleBadges({ user }: { user: PublicUser }) {
  const visible = user.roleLabels.filter((r) => r.role !== "sysadmin");
  if (visible.length === 0) return null;
  return (
    <span className="cabinet-role-badges">
      {visible.map((r) => (
        <span key={r.role} className="cabinet-role-icon" title={r.label}>
          {r.icon}
        </span>
      ))}
    </span>
  );
}

function AuthBox({
  inviteToken,
  onAuthed,
}: {
  inviteToken: string | null;
  onAuthed: (token: string, user: PublicUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setStep("form");
    setChallengeId(null);
    setErr(null);
    setInfo(null);
    setCode("");
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setInfo(null);
    const cleanEmail = email.trim().toLowerCase();
    if (mode === "login") {
      const res = await loginPassword(cleanEmail, password);
      setBusy(false);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onAuthed(res.token, res.user);
      return;
    }
    const res = await registerStart({
      email: cleanEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      patronymic: patronymic.trim(),
      gender,
      age: Number(age),
      password,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setChallengeId(res.challengeId);
    setStep("code");
    setInfo(`Код надіслано на ${cleanEmail}. Він діє 10 хвилин.`);
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
    setBusy(true);
    setErr(null);
    const res =
      mode === "login"
        ? await loginVerify(challengeId, code.trim())
        : await registerVerify(challengeId, code.trim());
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onAuthed(res.token, res.user);
  };

  const tabClass = (m: "login" | "register") =>
    m === mode ? "cabinet-auth-tab is-active" : "cabinet-auth-tab";

  return (
    <div className="p-block">
      <div className="p-block__head">Вхід та реєстрація</div>
      <div className="p-block__body cabinet-login">
        <div className="cabinet-auth-tabs" role="tablist">
          <button type="button" role="tab" className={tabClass("login")} onClick={() => switchMode("login")}>
            Вхід
          </button>
          <button type="button" role="tab" className={tabClass("register")} onClick={() => switchMode("register")}>
            Реєстрація
          </button>
        </div>

        {inviteToken && (
          <p className="cabinet-invite-hint">
            У вас є запрошення на посаду. Увійдіть або зареєструйтесь — його буде
            застосовано автоматично.
          </p>
        )}

        {step === "form" ? (
          <form onSubmit={onStart} className="cabinet-auth-form">
            <label className="apps-field">
              <span className="apps-field__label">
                Email<em>*</em>
              </span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="apps-field">
              <span className="apps-field__label">
                Пароль<em>*</em>
              </span>
              <input
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            {mode === "register" && (
              <>
                <label className="apps-field">
                  <span className="apps-field__label">
                    Прізвище<em>*</em>
                  </span>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </label>
                <label className="apps-field">
                  <span className="apps-field__label">
                    Ім'я<em>*</em>
                  </span>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </label>
                <label className="apps-field">
                  <span className="apps-field__label">
                    По батькові<em>*</em>
                  </span>
                  <input value={patronymic} onChange={(e) => setPatronymic(e.target.value)} required />
                </label>
                <label className="apps-field">
                  <span className="apps-field__label">
                    Стать<em>*</em>
                  </span>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="" disabled>
                      Оберіть...
                    </option>
                    <option value="male">Чоловіча</option>
                    <option value="female">Жіноча</option>
                  </select>
                </label>
                <label className="apps-field">
                  <span className="apps-field__label">
                    Вік<em>*</em>
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{1,2}"
                    maxLength={2}
                    placeholder="Напр. 25"
                    value={age}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setAge(digits);
                    }}
                    required
                  />
                </label>
                <p className="cabinet-auth-note">
                  На вказаний email надійде 6-значний код підтвердження — введіть
                  його, щоб завершити реєстрацію.
                </p>
              </>
            )}

            {err && <p className="cabinet-auth-msg cabinet-auth-msg--err">{err}</p>}
            {info && <p className="cabinet-auth-msg cabinet-auth-msg--ok">{info}</p>}
            <button type="submit" className="portal-cta" disabled={busy}>
              {busy ? "Зачекайте..." : mode === "login" ? "Увійти" : "Надіслати код"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="cabinet-auth-form">
            <p className="cabinet-auth-note">
              {mode === "register"
                ? "Ми надіслали 6-значний код на вашу пошту."
                : "Ми надіслали код для входу на вашу пошту."}
            </p>
            <label className="apps-field">
              <span className="apps-field__label">
                6-значний код<em>*</em>
              </span>
              <input
                className="cabinet-auth-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </label>
            {err && <p className="cabinet-auth-msg cabinet-auth-msg--err">{err}</p>}
            {info && <p className="cabinet-auth-msg cabinet-auth-msg--ok">{info}</p>}
            <button type="submit" className="portal-cta" disabled={busy || code.length !== 6}>
              {busy
                ? "Перевірка..."
                : mode === "login"
                  ? "Увійти"
                  : "Завершити реєстрацію"}
            </button>
            <button
              type="button"
              className="cabinet-auth-back"
              onClick={() => {
                setStep("form");
                setCode("");
                setErr(null);
                setInfo(null);
              }}
            >
              Змінити дані
            </button>
          </form>
        )}

        <p className="cabinet-auth-or">або</p>
        <a href={loginUrl(inviteToken ? `?invite=${inviteToken}` : undefined)} className="cabinet-google">
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </svg>
          Увійти через Google
        </a>
        <p className="cabinet-auth-note">
          Для акаунтів, створених раніше через Google.
        </p>
      </div>
    </div>
  );
}

export function CabinetPage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [apBody, setApBody] = useState("");
  const [apDate, setApDate] = useState("");
  const [apMsg, setApMsg] = useState<string | null>(null);
  const [apSaving, setApSaving] = useState(false);
  const apMountedAt = useRef(Date.now());

  const loadNotifications = useCallback(async () => {
    const items = await fetchNotifications();
    setNotifications(items);
    const unread = items.filter((n) => !n.read).map((n) => n.id);
    if (unread.length > 0) {
      await markNotificationsRead(unread);
      setNotifications((prev) =>
        prev.map((n) => (unread.includes(n.id) ? { ...n, read: true } : n)),
      );
    }
  }, []);

  const loadUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    if (me) {
      void loadNotifications();
      if (!me.needsProfile) {
        setApplications(await fetchApplications());
        setAppointments(await fetchAppointments());
      }
    }
    setLoading(false);
  }, [loadNotifications]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hashToken = readHashToken();
    if (hashToken) {
      setToken(hashToken);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const err = url.searchParams.get("auth_error");
    if (err === "banned") {
      setAuthError("Ваш акаунт заблоковано. Зверніться до адміністрації.");
    } else if (err) {
      setAuthError("Авторизація не вдалася. Спробуйте ще раз.");
    }

    const inv = url.searchParams.get("invite");
    if (inv) {
      setInviteToken(inv);
      url.searchParams.delete("invite");
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    if (getToken() || hashToken) {
      void loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  useEffect(() => {
    if (!inviteToken || !user) return;
    if (user.needsProfile) return;
    void (async () => {
      const res = await acceptInvite(inviteToken);
      if (res.ok) {
        setUser(res.user);
        const labels = res.user.roleLabels
          .filter((r) => r.role !== "sysadmin")
          .map((r) => r.label)
          .join(", ");
        setInviteMsg(`Посаду надано: ${labels || res.user.roles.join(", ")}`);
      } else {
        setInviteMsg(res.error);
      }
      setInviteToken(null);
    })();
  }, [inviteToken, user]);

  const onLogout = async () => {
    await logout();
    setUser(null);
    setApplications([]);
    setAppointments([]);
    setNotifications([]);
  };

  const handleAuthed = (token: string, newUser: PublicUser) => {
    setToken(token);
    setUser(newUser);
    setAuthError(null);
    if (!newUser.needsProfile) {
      void loadNotifications();
      void fetchApplications().then(setApplications);
      void fetchAppointments().then(setAppointments);
    }
  };

  const onAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apBody.trim() || !apDate) return;
    setApSaving(true);
    setApMsg(null);
    const res = await createAppointment(
      apBody.trim(),
      apDate,
      apMountedAt.current,
    );
    setApSaving(false);
    if (!res.ok) {
      setApMsg(res.error);
      return;
    }
    setApBody("");
    setApDate("");
    setApMsg("Запит надіслано. Очікуйте дзвінка кол-центру.");
    void fetchAppointments().then(setAppointments);
  };

  const AP_STATUS_UI: Record<string, string> = {
    new: "Нова",
    in_progress: "У роботі",
    accepted: "Прийнята",
    rejected: "Відхилена",
  };

  return (
    <PortalLayout title="Особистий кабінет">
      <p className="p-lead">
        Увійдіть або зареєструйтеся, щоб подавати та відстежувати заявки, а також
        керувати своїми персональними даними.
      </p>

      {authError && (
        <div className="p-block cabinet-error">
          <div className="p-block__head">Помилка</div>
          <div className="p-block__body">{authError}</div>
        </div>
      )}

      {inviteMsg && (
        <div className="p-block cabinet-invite-msg">
          <div className="p-block__head p-block__head--teal">Запрошення</div>
          <div className="p-block__body">{inviteMsg}</div>
        </div>
      )}

      {loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : !user ? (
        <AuthBox inviteToken={inviteToken} onAuthed={handleAuthed} />
      ) : user.needsProfile ? (
        <ProfileForm
          user={user}
          onSaved={(updated) => {
            setUser(updated);
            void fetchApplications().then(setApplications);
            void loadNotifications();
          }}
        />
      ) : (
        <>
          <div className="p-block">
            <div className="p-block__head p-block__head--teal">
              {user.lastName} {user.firstName} {user.patronymic}
              <RoleBadges user={user} />
            </div>
            <div className="p-block__body cabinet-profile-row">
              {user.avatar ? (
                <img src={user.avatar} alt="Аватар" className="cabinet-avatar" />
              ) : (
                <span className="cabinet-avatar cabinet-avatar--empty">Фото</span>
              )}
              <span>
                <strong>Стать:</strong>{" "}
                {user.gender === "female" ? "Жіноча" : "Чоловіча"}
              </span>
              <span>
                <strong>Вік:</strong> {user.age}
              </span>
              <span>
                <strong>Email:</strong> {user.email ?? "—"}
              </span>
              <button type="button" className="cabinet-logout" onClick={onLogout}>
                Вийти
              </button>
            </div>
          </div>

          {notifications.length > 0 && (
            <div className="p-block">
              <div className="p-block__head">Сповіщення</div>
              <ul className="cabinet-notifs">
                {notifications.slice(0, 10).map((n) => (
                  <li key={n.id} className="cabinet-notifs__item">
                    <strong>{n.title}</strong>
                    {n.body && <p>{n.body}</p>}
                    <span className="cabinet-notifs__date">
                      {new Date(n.createdAt + "Z").toLocaleString("uk-UA")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-block">
            <div className="p-block__head p-block__head--teal">Мої заявки</div>
            <div className="p-block__body">
              {applications.length === 0 ? (
                <div className="cabinet-empty">
                  <p>Ще немає звернень. Подайте першу заявку.</p>
                  <Link to="/zayavky" className="portal-cta">
                    Подати заявку
                  </Link>
                </div>
              ) : (
                <ul className="cabinet-apps">
                  {applications.map((app) => (
                    <AppItem key={app.id} app={app} />
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="p-block">
            <div className="p-block__head p-block__head--teal">
              Запис на прийом
            </div>
            <div className="p-block__body">
              <p className="cabinet-profile-note">
                Опишіть скарги та бажану дату — оператор кол-центру зателефонує
                для підтвердження.
              </p>
              <form onSubmit={onAppointment} className="cabinet-ann-form">
                <textarea
                  value={apBody}
                  onChange={(e) => setApBody(e.target.value)}
                  placeholder="Скарги, бажаний лікар або відділення..."
                  maxLength={2000}
                  rows={3}
                  required
                />
                <label className="apps-field">
                  <span className="apps-field__label">Бажана дата</span>
                  <input
                    type="date"
                    value={apDate}
                    onChange={(e) => setApDate(e.target.value)}
                    required
                  />
                </label>
                <div className="cabinet-ann-actions">
                  <button type="submit" className="portal-cta" disabled={apSaving}>
                    {apSaving ? "..." : "Надіслати запит"}
                  </button>
                </div>
              </form>
              {apMsg && <p className="cabinet-profile-note">{apMsg}</p>}
              {appointments.length > 0 && (
                <ul className="cabinet-apps" style={{ marginTop: "0.8rem" }}>
                  {appointments.map((a) => (
                    <li key={a.id} className="cabinet-apps__item">
                      <div className="cabinet-apps__head">
                        <strong>Запис на прийом</strong>
                        <span
                          className={`cabinet-apps__status cabinet-apps__status--${a.status}`}
                        >
                          {AP_STATUS_UI[a.status] ?? a.statusLabel}
                        </span>
                      </div>
                      <div className="cabinet-apps__date">
                        Бажана дата: {a.wantDate} ·{" "}
                        {new Date(a.createdAt + "Z").toLocaleString("uk-UA")}
                      </div>
                      <div className="cabinet-review-answers">
                        <p>{a.body}</p>
                      </div>
                      {a.decisionNote && (
                        <div className="cabinet-apps__note">{a.decisionNote}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <SettingsBlock user={user} onSaved={setUser} />

          <SecurityBlock user={user} onChanged={setUser} />
        </>
      )}

      <div className="p-block">
        <div className="p-block__head">Як це працює</div>
        <div className="p-block__body">
          <ul className="p-list">
            <li>Гість — переглядає сайт, але не може подавати заявки.</li>
            <li>
              Реєстрація: вкажіть email, пароль, ПІБ, стать і вік — на пошту
              надійде 6-значний код підтвердження.
            </li>
            <li>
              Вхід: email і пароль або обліковий запис Google (пароль можна
              встановити пізніше в налаштуваннях).
            </li>
            <li>Нові користувачі отримують роль "Пацієнт".</li>
            <li>Посади призначаються генеральним або медичним директором.</li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  );
}

function AppItem({ app }: { app: ApplicationItem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    const res = await fetchMessages(app.id);
    setMessages(res.messages);
  }, [app.id]);

  useEffect(() => {
    if (open) void loadMessages();
  }, [open, loadMessages]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await sendMessage(app.id, text.trim());
    setSending(false);
    if (res.ok) {
      setText("");
      void loadMessages();
    }
  };

  const showChat =
    app.status === "reviewing" || app.status === "dialogue" || open;

  return (
    <li className="cabinet-apps__item">
      <div className="cabinet-apps__head">
        <strong>{app.formTitle}</strong>
        <span className={`cabinet-apps__status cabinet-apps__status--${app.status}`}>
          {app.statusLabel}
        </span>
      </div>
      <div className="cabinet-apps__date">
        {new Date(app.createdAt + "Z").toLocaleString("uk-UA")}
      </div>
      {app.decisionNote && (
        <div className="cabinet-apps__note">{app.decisionNote}</div>
      )}
      {(app.status === "reviewing" || app.status === "dialogue") && (
        <button
          type="button"
          className="cabinet-logout cabinet-chat-toggle"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Закрити діалог" : "Відкрити діалог"}
        </button>
      )}
      {showChat && (
        <div className="cabinet-chat">
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
              placeholder="Написати повідомлення..."
              maxLength={4000}
            />
            <button type="submit" className="portal-cta" disabled={sending}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function SecurityBlock({
  user,
  onChanged,
}: {
  user: PublicUser;
  onChanged: (u: PublicUser) => void;
}) {
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [curPw, setCurPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [emOpen, setEmOpen] = useState(false);
  const [em, setEm] = useState("");
  const [emChallenge, setEmChallenge] = useState<string | null>(null);
  const [emCode, setEmCode] = useState("");
  const [emMsg, setEmMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emBusy, setEmBusy] = useState(false);

  const onSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg(null);
    const res = await setPassword(pw, user.hasPassword ? curPw : undefined);
    setPwBusy(false);
    if (!res.ok) {
      setPwMsg({ ok: false, text: res.error });
      return;
    }
    setPwMsg({ ok: true, text: "Пароль збережено." });
    setPwOpen(false);
    setPw("");
    setCurPw("");
    onChanged({ ...user, hasPassword: true });
  };

  const onEmailStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmBusy(true);
    setEmMsg(null);
    const res = await emailChangeStart(em.trim().toLowerCase());
    setEmBusy(false);
    if (!res.ok) {
      setEmMsg({ ok: false, text: res.error });
      return;
    }
    setEmChallenge(res.challengeId);
    setEmMsg({ ok: true, text: `Код надіслано на ${em.trim()}. Він діє 10 хвилин.` });
  };

  const onEmailVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emChallenge) return;
    setEmBusy(true);
    setEmMsg(null);
    const res = await emailChangeVerify(emChallenge, emCode.trim());
    setEmBusy(false);
    if (!res.ok) {
      setEmMsg({ ok: false, text: res.error });
      return;
    }
    setEmMsg({ ok: true, text: `Email змінено на ${res.email}` });
    onChanged({ ...user, email: res.email });
    setEmOpen(false);
    setEmChallenge(null);
    setEmCode("");
    setEm("");
  };

  const msgClass = (m: { ok: boolean } | null) =>
    m
      ? `cabinet-auth-msg ${m.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`
      : undefined;

  return (
    <div className="p-block">
      <div className="p-block__head">Безпека та email</div>
      <div className="p-block__body cabinet-security">
        <div className="cabinet-security__row">
          <span>
            <strong>Пароль:</strong>{" "}
            {user.hasPassword ? "встановлено" : "не встановлено"}
          </span>
          <button type="button" className="cabinet-logout" onClick={() => setPwOpen((v) => !v)}>
            {pwOpen ? "Скасувати" : user.hasPassword ? "Змінити пароль" : "Встановити пароль"}
          </button>
        </div>
        {pwOpen && (
          <form onSubmit={onSetPassword} className="cabinet-auth-form">
            {user.hasPassword && (
              <label className="apps-field">
                <span className="apps-field__label">Поточний пароль</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  required
                />
              </label>
            )}
            <label className="apps-field">
              <span className="apps-field__label">Новий пароль (від 6 символів)</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                minLength={6}
                required
              />
            </label>
            {pwMsg && <p className={msgClass(pwMsg)}>{pwMsg.text}</p>}
            <button type="submit" className="portal-cta" disabled={pwBusy}>
              {pwBusy ? "Збереження..." : "Зберегти пароль"}
            </button>
          </form>
        )}

        <div className="cabinet-security__row">
          <span>
            <strong>Email:</strong> {user.email ?? "—"}
          </span>
          <button type="button" className="cabinet-logout" onClick={() => setEmOpen((v) => !v)}>
            {emOpen ? "Скасувати" : "Змінити email"}
          </button>
        </div>
        {emOpen && (
          <form
            onSubmit={emChallenge ? onEmailVerify : onEmailStart}
            className="cabinet-auth-form"
          >
            <label className="apps-field">
              <span className="apps-field__label">Новий email</span>
              <input
                type="email"
                value={em}
                onChange={(e) => setEm(e.target.value)}
                disabled={!!emChallenge}
                required
              />
            </label>
            {emChallenge && (
              <label className="apps-field">
                <span className="apps-field__label">6-значний код з листа</span>
                <input
                  className="cabinet-auth-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={emCode}
                  onChange={(e) => setEmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </label>
            )}
            {emMsg && <p className={msgClass(emMsg)}>{emMsg.text}</p>}
            <button
              type="submit"
              className="portal-cta"
              disabled={emBusy || (emChallenge && emCode.length !== 6)}
            >
              {emBusy
                ? "Надсилання..."
                : emChallenge
                  ? "Підтвердити код"
                  : "Надіслати код"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function SettingsBlock({
  user,
  onSaved,
}: {
  user: PublicUser;
  onSaved: (u: PublicUser) => void;
}) {
  const [emailOn, setEmailOn] = useState(user.emailNotifications);
  const [saving, setSaving] = useState(false);

  const onChange = async (checked: boolean) => {
    setEmailOn(checked);
    setSaving(true);
    await saveSettings(checked);
    setSaving(false);
    onSaved({ ...user, emailNotifications: checked });
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Налаштування</div>
      <div className="p-block__body cabinet-settings">
        <label className="cabinet-settings__row">
          <input
            type="checkbox"
            checked={emailOn}
            onChange={(e) => void onChange(e.target.checked)}
            disabled={saving}
          />
          <span>Отримувати сповіщення на пошту про статус заявок</span>
        </label>
      </div>
    </div>
  );
}

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Некоректне зображення"));
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas недоступний"));
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function ProfileForm({
  user,
  onSaved,
}: {
  user: PublicUser;
  onSaved: (user: PublicUser) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [patronymic, setPatronymic] = useState(user.patronymic ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeAvatar(file);
      setAvatar(dataUrl);
    } catch {
      setError("Не вдалося обробити фото. Оберіть інше зображення.");
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await saveProfile({
      firstName,
      lastName,
      patronymic,
      gender,
      age: Number(age),
      avatar,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved(res.user);
  };

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Заповніть профіль</div>
      <div className="p-block__body">
        <p className="cabinet-profile-note">
          Вкажіть ПІБ українською, стать та вік — інакше подача заявок
          недоступна.
        </p>
        <form onSubmit={onSubmit} className="cabinet-profile-form">
          <label className="apps-field">
            <span className="apps-field__label">
              Прізвище<em>*</em>
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              Ім'я<em>*</em>
            </span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              По батькові<em>*</em>
            </span>
            <input
              type="text"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              required
            />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              Стать<em>*</em>
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>
                Оберіть...
              </option>
              <option value="male">Чоловіча</option>
              <option value="female">Жіноча</option>
            </select>
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              Вік<em>*</em>
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{1,2}"
              maxLength={2}
              placeholder="Напр. 25"
              value={age}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
                setAge(digits);
              }}
              required
            />
          </label>
          <div className="cabinet-avatar-field">
            <span className="apps-field__label">Фото профілю</span>
            <div className="cabinet-avatar-row">
              {avatar ? (
                <img src={avatar} alt="Аватар" className="cabinet-avatar" />
              ) : (
                <span className="cabinet-avatar cabinet-avatar--empty">Фото</span>
              )}
              <label className="cabinet-avatar-upload">
                Обрати фото
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onAvatar(e)}
                  hidden
                />
              </label>
              {avatar && (
                <button
                  type="button"
                  className="cabinet-logout"
                  onClick={() => setAvatar(null)}
                >
                  Прибрати
                </button>
              )}
            </div>
          </div>
          {error && <p className="cabinet-profile-error">{error}</p>}
          <button type="submit" className="portal-cta" disabled={saving}>
            {saving ? "Збереження..." : "Зберегти профіль"}
          </button>
        </form>
      </div>
    </div>
  );
}
