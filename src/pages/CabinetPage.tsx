import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  acceptInvite,
  accountRequest,
  emailChangeStart,
  emailChangeVerify,
  fetchAppointments,
  fetchApplications,
  fetchAppointmentMessages,
  fetchMe,
  fetchMessages,
  fetchSessions,
  fetchUnread,
  getToken,
  googleLinkStart,
  googleRegisterVerify,
  googleUnlink,
  loginPassword,
  loginUrl,
  loginVerify,
  logout,
  markSeen,
  passwordChangeConfirm,
  passwordChangeStart,
  registerStart,
  registerVerify,
  revokeSession,
  saveProfile,
  saveSettings,
  sendMessage,
  sendAppointmentMessage,
  setToken,
  type AppointmentItem,
  type ApplicationItem,
  type DialogueMessage,
  type PublicUser,
  type SessionItem,
} from "../api";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import { ROLE_ICONS_UI } from "../data/roles";
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
          <Icon icon={ROLE_ICONS_UI[r.role] ?? "mdi:account"} width={16} height={16} />
        </span>
      ))}
    </span>
  );
}

function AuthBox({
  inviteToken,
  googleChallengeId,
  onGoogleChallengeUsed,
  onAuthed,
}: {
  inviteToken: string | null;
  googleChallengeId?: string | null;
  onGoogleChallengeUsed?: () => void;
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
  const [googleMode, setGoogleMode] = useState(false);

  useEffect(() => {
    if (googleChallengeId) {
      setGoogleMode(true);
      setStep("code");
      setInfo("Код надіслано на вашу пошту Google. Введіть його, щоб завершити вхід.");
    }
  }, [googleChallengeId]);

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setStep("form");
    setChallengeId(null);
    setErr(null);
    setInfo(null);
    setCode("");
    setGoogleMode(false);
    onGoogleChallengeUsed?.();
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
        if (res.error.includes("зареєстровано")) {
          setErr(res.error);
          switchMode("register");
          setEmail(cleanEmail);
          return;
        }
        setErr(res.error);
        return;
      }
      setChallengeId(res.challengeId);
      setStep("code");
      setInfo(`Код надіслано на ${res.email}. Він діє 10 хвилин.`);
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
      if (res.error.includes("зареєстровано")) {
        setErr("Цей email уже зареєстровано. Увійдіть у кабінет.");
        switchMode("login");
        setEmail(cleanEmail);
        return;
      }
      setErr(res.error);
      return;
    }
    setChallengeId(res.challengeId);
    setStep("code");
    setInfo(`Код надіслано на ${cleanEmail}. Він діє 10 хвилин.`);
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleMode && googleChallengeId) {
      setBusy(true);
      setErr(null);
      const res = await googleRegisterVerify(googleChallengeId, code.trim());
      setBusy(false);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onGoogleChallengeUsed?.();
      onAuthed(res.token, res.user);
      return;
    }
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
              {googleMode
                ? "Ми надіслали 6-значний код на вашу пошту Google — введіть його, щоб створити акаунт і увійти."
                : mode === "register"
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
                : googleMode
                  ? "Увійти"
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
                setGoogleMode(false);
                onGoogleChallengeUsed?.();
              }}
            >
              Змінити дані
            </button>
          </form>
        )}

        <p className="cabinet-auth-or">або</p>
        <a href={loginUrl(inviteToken ? `?invite=${inviteToken}` : undefined)} className="cabinet-google">
          <Icon icon="mdi:google" width={18} height={18} />
          Увійти через Google
        </a>
        <p className="cabinet-auth-note">
          Новий акаунт буде створено після підтвердження 6-значним кодом з вашої
          пошти Google.
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
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [pwChangeToken, setPwChangeToken] = useState<string | null>(null);
  const [pwChangeMsg, setPwChangeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwChangeBusy, setPwChangeBusy] = useState(false);
  const [googleChallenge, setGoogleChallenge] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<CabinetTab | null>(null);
  const [initialApp, setInitialApp] = useState<string | null>(null);
  const [unread, setUnread] = useState<{ applications: number; appointments: number }>({
    applications: 0,
    appointments: 0,
  });

  const loadUnread = useCallback(async () => {
    setUnread(await fetchUnread());
  }, []);

  const loadUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    if (me) {
      void loadUnread();
      if (!me.needsProfile) {
        setApplications(await fetchApplications());
        setAppointments(await fetchAppointments());
      }
    }
    setLoading(false);
  }, [loadUnread]);

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
    } else if (err === "blocked_device") {
      setAuthError("Пристрій, з якого ви намагаєтесь увійти, заблоковано.");
    } else if (err === "not_registered") {
      setAuthError(
        "Акаунт Google ще не прив'язано. Зареєструйтесь через email і пароль, а потім прив'яжіть Google у налаштуваннях.",
      );
    } else if (err) {
      setAuthError("Авторизація не вдалася. Спробуйте ще раз.");
    }

    const googleLinked = url.searchParams.get("google_linked");
    if (googleLinked === "1") {
      setAuthError(null);
      setInviteMsg("Google-акаунт успішно прив'язано.");
    } else if (url.searchParams.get("google_link") === "already") {
      setAuthError("Цей Google-акаунт уже прив'язано до іншого акаунта.");
    } else if (url.searchParams.get("google_link") === "error") {
      setAuthError("Не вдалося прив'язати Google-акаунт. Спробуйте ще раз.");
    }

    const inv = url.searchParams.get("invite");
    if (inv) {
      setInviteToken(inv);
      url.searchParams.delete("invite");
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    const googleChallengeId = url.searchParams.get("google_challenge");
    if (googleChallengeId) {
      setGoogleChallenge(googleChallengeId);
      url.searchParams.delete("google_challenge");
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    const tabParam = url.searchParams.get("tab");
    if (tabParam === "profile" || tabParam === "apps" || tabParam === "appts" || tabParam === "settings") {
      setInitialTab(tabParam);
      url.searchParams.delete("tab");
    }
    const appParam = url.searchParams.get("app");
    if (appParam) {
      setInitialApp(appParam);
      setInitialTab("apps");
      url.searchParams.delete("app");
    }
    if (tabParam || appParam) {
      window.history.replaceState(null, "", url.pathname + url.search);
    }

    const pwTok = url.searchParams.get("pw_change");
    if (pwTok) {
      setPwChangeToken(pwTok);
      url.searchParams.delete("pw_change");
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
  };

  const handleAuthed = (token: string, newUser: PublicUser) => {
    setToken(token);
    setUser(newUser);
    setAuthError(null);
    if (!newUser.needsProfile) {
      void loadUnread();
      void fetchApplications().then(setApplications);
      void fetchAppointments().then(setAppointments);
    }
  };

  const onPwChangeConfirm = async () => {
    if (!pwChangeToken) return;
    setPwChangeBusy(true);
    setPwChangeMsg(null);
    const res = await passwordChangeConfirm(pwChangeToken);
    setPwChangeBusy(false);
    if (!res.ok) {
      setPwChangeMsg({ ok: false, text: res.error });
      return;
    }
    setPwChangeMsg({ ok: true, text: "Пароль успішно змінено. Увійдіть з новим паролем." });
    setPwChangeToken(null);
  };

  const AP_STATUS_UI: Record<string, string> = {
    new: "Нова",
    in_progress: "У роботі",
    accepted: "Прийнята",
    rejected: "Відхилена",
  };

  return (
    <PortalLayout title="Особистий кабінет">
      {!user && (
        <p className="p-lead">
          Увійдіть або зареєструйтеся, щоб подавати та відстежувати заявки, а також
          керувати своїми персональними даними.
        </p>
      )}

      {authError && (
        <div className="p-block cabinet-error">
          <div className="p-block__head">Помилка</div>
          <div className="p-block__body">{authError}</div>
        </div>
      )}

      {inviteMsg && (
        <div className="p-block cabinet-invite-msg">
          <div className="p-block__head p-block__head--teal">Сповіщення</div>
          <div className="p-block__body">{inviteMsg}</div>
        </div>
      )}

      {pwChangeToken && (
        <div className="p-block">
          <div className="p-block__head p-block__head--teal">Підтвердження зміни пароля</div>
          <div className="p-block__body">
            <p className="cabinet-profile-note">
              Натисніть кнопку нижче, щоб підтвердити зміну пароля.
            </p>
            {pwChangeMsg && (
              <p
                className={`cabinet-auth-msg ${pwChangeMsg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
              >
                {pwChangeMsg.text}
              </p>
            )}
            {!pwChangeMsg?.ok && (
              <button
                type="button"
                className="portal-cta"
                onClick={() => void onPwChangeConfirm()}
                disabled={pwChangeBusy}
              >
                {pwChangeBusy ? "Підтвердження..." : "Підтвердити зміну пароля"}
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : !user ? (
        <AuthBox
          inviteToken={inviteToken}
          googleChallengeId={googleChallenge}
          onGoogleChallengeUsed={() => setGoogleChallenge(null)}
          onAuthed={handleAuthed}
        />
      ) : user.needsProfile ? (
        <ProfileForm
          user={user}
          onSaved={(updated) => {
            setUser(updated);
            void fetchApplications().then(setApplications);
          }}
        />
      ) : (
        <>
          {user.warnings > 0 && (
            <div className="p-block cabinet-warn">
              <div className="p-block__head">Попередження</div>
              <div className="p-block__body">
                Вас попереджено {user.warnings} раз(ів). За повторні порушення акаунт
                може бути тимчасово заблоковано.
              </div>
            </div>
          )}
          {user.blockedUntil && new Date(user.blockedUntil + "Z") > new Date() && (
            <div className="p-block cabinet-blocked">
              <div className="p-block__head">Тимчасова блокування</div>
              <div className="p-block__body">
                Акаунт заблоковано до{" "}
                {new Date(user.blockedUntil + "Z").toLocaleString("uk-UA")}. Деякі
                дії недоступні.
              </div>
            </div>
          )}
          <div className="p-block cabinet-header">
            <div className="p-block__body cabinet-header__body">
              <div className="cabinet-header__left">
                {user.avatar ? (
                  <img src={user.avatar} alt="Аватар" className="cabinet-avatar" />
                ) : (
                  <span className="cabinet-avatar cabinet-avatar--empty">Фото</span>
                )}
                <div className="cabinet-header__info">
                  <strong>
                    {user.lastName} {user.firstName} {user.patronymic}
                  </strong>
                  <span className="cabinet-header__email">{user.email ?? "—"}</span>
                  <RoleBadges user={user} />
                </div>
              </div>
              <button type="button" className="cabinet-logout" onClick={onLogout}>
                Вийти
              </button>
            </div>
          </div>

          <CabinetTabs
            user={user}
            applications={applications}
            appointments={appointments}
            unread={unread}
            apStatusUi={AP_STATUS_UI}
            onUserUpdated={setUser}
            initialTab={initialTab}
            initialApp={initialApp}
            onNavigate={() => {
              setInitialApp(null);
              void loadUnread();
            }}
          />
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
              Вхід: email і пароль (підтверджується кодом на пошту) або
              обліковий запис Google.
            </li>
            <li>Нові користувачі отримують роль "Пацієнт".</li>
            <li>Посади призначаються генеральним або медичним директором.</li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  );
}

type CabinetTab = "profile" | "apps" | "appts" | "settings";

function CabinetTabs({
  user,
  applications,
  appointments,
  unread,
  apStatusUi,
  onUserUpdated,
  initialTab,
  initialApp,
  onNavigate,
}: {
  user: PublicUser;
  applications: ApplicationItem[];
  appointments: AppointmentItem[];
  unread: { applications: number; appointments: number };
  apStatusUi: Record<string, string>;
  onUserUpdated: (u: PublicUser) => void;
  initialTab: CabinetTab | null;
  initialApp: string | null;
  onNavigate: () => void;
}) {
  const [tab, setTab] = useState<CabinetTab | null>(initialTab);
  const [highlight, setHighlight] = useState<string | null>(initialApp);

  useEffect(() => {
    if (initialApp) {
      setHighlight(initialApp);
      const el = document.getElementById(`app-${initialApp}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [initialApp]);

  const tabs: {
    id: CabinetTab;
    label: string;
    desc: string;
    icon: string;
    badge: number;
  }[] = [
    { id: "profile", label: "Профіль", desc: "Персональні дані та аватар", icon: "mdi:account-circle", badge: 0 },
    {
      id: "apps",
      label: "Мої заявки",
      desc: "Звернення та статуси",
      icon: "mdi:file-document-edit-outline",
      badge: unread.applications,
    },
    {
      id: "appts",
      label: "Записи на прийом",
      desc: "Запити та дати",
      icon: "mdi:calendar-clock",
      badge: unread.appointments,
    },
    { id: "settings", label: "Налаштування", desc: "Пароль, пошта, Google", icon: "mdi:cog-outline", badge: 0 },
  ];

  const openTab = (t: CabinetTab) => {
    setTab((prev) => (prev === t ? null : t));
    if (t === "apps") void markSeen("applications");
    if (t === "appts") void markSeen("appointments");
    onNavigate();
  };

  return (
    <>
      <div className="cabinet-tiles">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cabinet-tile${tab === t.id ? " is-active" : ""}`}
            onClick={() => openTab(t.id)}
          >
            <span className="cabinet-tile__icon">
              <Icon icon={t.icon} width={28} height={28} />
            </span>
            <span className="cabinet-tile__label">{t.label}</span>
            <span className="cabinet-tile__desc">{t.desc}</span>
            {t.badge > 0 && <span className="cabinet-tile__badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} onSaved={onUserUpdated} />}

      {tab === "apps" && (
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
                  <li
                    key={app.id}
                    id={`app-${app.id}`}
                    className={`cabinet-apps__wrap${highlight === app.id ? " is-highlighted" : ""}`}
                  >
                    <AppItem app={app} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "appts" && (
        <div className="p-block">
          <div className="p-block__head p-block__head--teal">Записи на прийом</div>
          <div className="p-block__body">
            <p className="cabinet-profile-note">
              Подати новий запит можна на{" "}
              <Link to="/zapys-na-pryiom">публичній сторінці запису</Link>.
            </p>
            {appointments.length === 0 ? (
              <div className="cabinet-empty">
                <p>Ще немає записів.</p>
                <Link to="/zapys-na-pryiom" className="portal-cta">
                  Записатися на прийом
                </Link>
              </div>
            ) : (
              <ul className="cabinet-apps">
                {appointments.map((a) => (
                  <li key={a.id} className="cabinet-apps__item">
                    <div className="cabinet-apps__head">
                      <strong>Запис на прийом</strong>
                      <span className={`cabinet-apps__status cabinet-apps__status--${a.status}`}>
                        {apStatusUi[a.status] ?? a.statusLabel}
                      </span>
                    </div>
                    <div className="cabinet-apps__date">
                      Бажана дата: {a.wantDate} ·{" "}
                      {new Date(a.createdAt + "Z").toLocaleString("uk-UA")}
                    </div>
                    <div className="cabinet-review-answers">
                      <p>{a.body}</p>
                    </div>
                    {(a.status === "accepted" || a.status === "rejected") && (
                      <div className="cabinet-apps__note">
                        Причина: {a.decisionNote || "Не вказана"}
                      </div>
                    )}
                    <AppointmentChat appointment={a} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <SettingsTab user={user} onUserUpdated={onUserUpdated} />
      )}
    </>
  );
}

function AppItem({ app }: { app: ApplicationItem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadMessages = useCallback(async () => {
    const res = await fetchMessages(app.id);
    setMessages(res.messages);
  }, [app.id]);

  useEffect(() => {
    if (!open) return;
    void loadMessages();
    const t = window.setInterval(() => void loadMessages(), 2000);
    return () => window.clearInterval(t);
  }, [open, loadMessages]);

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
      void loadMessages();
    }
  };

  const decided = app.status === "accepted" || app.status === "rejected";

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
      {decided && (
        <div className="cabinet-apps__note">
          Причина: {app.decisionNote || "Не вказана"}
        </div>
      )}
      {!decided && (
        <button
          type="button"
          className="cabinet-logout cabinet-chat-toggle"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Закрити діалог" : "Відкрити діалог"}
        </button>
      )}
      {open && !decided && (
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
              placeholder="Написати повідомлення..."
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
            {file && <span className="cabinet-chat__file">{file.name}</span>}
            <button type="submit" className="portal-cta" disabled={sending}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function AppointmentChat({ appointment }: { appointment: AppointmentItem }) {
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
          {open ? "Закрити чат" : "Чат з адміністрацією"}
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
              placeholder="Написати повідомлення..."
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
            {file && <span className="cabinet-chat__file">{file.name}</span>}
            <button type="submit" className="portal-cta" disabled={sending}>
              {sending ? "..." : "Надіслати"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ProfileTab({
  user,
  onSaved,
}: {
  user: PublicUser;
  onSaved: (u: PublicUser) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [patronymic, setPatronymic] = useState(user.patronymic ?? "");
  const [gender, setGender] = useState(user.gender ?? "");
  const [age, setAge] = useState(user.age ? String(user.age) : "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

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
    setOkMsg(null);
    const res = await saveProfile({
      firstName,
      lastName,
      patronymic,
      gender,
      age: Number(age),
      avatar,
      bio,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOkMsg("Профіль збережено.");
    onSaved(res.user);
  };

  const registered = user.createdAt
    ? new Date(user.createdAt + "Z").toLocaleDateString("uk-UA")
    : "—";

  return (
    <div className="p-block">
      <div className="p-block__head p-block__head--teal">Профіль</div>
      <div className="p-block__body">
        <p className="cabinet-profile-note">Дата реєстрації: {registered}</p>
        <form onSubmit={onSubmit} className="cabinet-profile-form">
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
                <input type="file" accept="image/*" onChange={(e) => void onAvatar(e)} hidden />
              </label>
              {avatar && (
                <button type="button" className="cabinet-logout" onClick={() => setAvatar(null)}>
                  Прибрати
                </button>
              )}
            </div>
          </div>
          <label className="apps-field">
            <span className="apps-field__label">
              Прізвище<em>*</em>
            </span>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              Ім'я<em>*</em>
            </span>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </label>
          <label className="apps-field">
            <span className="apps-field__label">
              По батькові<em>*</em>
            </span>
            <input type="text" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} required />
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
          <label className="apps-field">
            <span className="apps-field__label">Про себе</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Коротко про себе (необов'язково)"
              maxLength={500}
              rows={3}
            />
          </label>
          {error && <p className="cabinet-profile-error">{error}</p>}
          {okMsg && <p className="cabinet-auth-msg cabinet-auth-msg--ok">{okMsg}</p>}
          <button type="submit" className="portal-cta" disabled={saving}>
            {saving ? "Збереження..." : "Зберегти профіль"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SettingsTab({
  user,
  onUserUpdated,
}: {
  user: PublicUser;
  onUserUpdated: (u: PublicUser) => void;
}) {
  return (
    <>
      <EmailNotifBlock user={user} onUserUpdated={onUserUpdated} />
      <PasswordBlock user={user} onUserUpdated={onUserUpdated} />
      <EmailChangeBlock user={user} onUserUpdated={onUserUpdated} />
      <GoogleBlock user={user} />
      <SessionsBlock />
      <AccountBlock />
    </>
  );
}

function EmailNotifBlock({
  user,
  onUserUpdated,
}: {
  user: PublicUser;
  onUserUpdated: (u: PublicUser) => void;
}) {
  const [emailOn, setEmailOn] = useState(user.emailNotifications);
  const [saving, setSaving] = useState(false);

  const onChange = async (checked: boolean) => {
    setEmailOn(checked);
    setSaving(true);
    await saveSettings(checked);
    setSaving(false);
    onUserUpdated({ ...user, emailNotifications: checked });
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Сповіщення на пошту</div>
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

function PasswordBlock({
  user,
  onUserUpdated,
}: {
  user: PublicUser;
  onUserUpdated: (u: PublicUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [curPw, setCurPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) {
      setMsg({ ok: false, text: "Паролі не збігаються." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await passwordChangeStart(pw, user.hasPassword ? curPw : undefined);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({
      ok: true,
      text: `Лист із підтвердженням надіслано на ${res.email}. Перейдіть за посиланням у листі, щоб завершити зміну пароля.`,
    });
    setOpen(false);
    setPw("");
    setPw2("");
    setCurPw("");
    onUserUpdated({ ...user, hasPassword: true });
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Пароль</div>
      <div className="p-block__body cabinet-security">
        <div className="cabinet-security__row">
          <span>
            <strong>Статус:</strong>{" "}
            {user.hasPassword ? "встановлено" : "не встановлено"}
          </span>
          <button type="button" className="cabinet-logout" onClick={() => setOpen((v) => !v)}>
            {open ? "Скасувати" : user.hasPassword ? "Змінити пароль" : "Встановити пароль"}
          </button>
        </div>
        {open && (
          <form onSubmit={onSubmit} className="cabinet-auth-form">
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
            <label className="apps-field">
              <span className="apps-field__label">Повторіть новий пароль</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <p className="cabinet-auth-note">
              Після збереження на пошту надійде лист із посиланням для підтвердження.
            </p>
            {msg && (
              <p
                className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
              >
                {msg.text}
              </p>
            )}
            <button type="submit" className="portal-cta" disabled={busy}>
              {busy ? "Надсилання..." : "Надіслати на підтвердження"}
            </button>
          </form>
        )}
        {msg && !open && (
          <p
            className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function EmailChangeBlock({
  user,
  onUserUpdated,
}: {
  user: PublicUser;
  onUserUpdated: (u: PublicUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const [em, setEm] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await emailChangeStart(em.trim().toLowerCase());
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setChallenge(res.challengeId);
    setMsg({ ok: true, text: `Код надіслано на ${em.trim()}. Він діє 10 хвилин.` });
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;
    setBusy(true);
    setMsg(null);
    const res = await emailChangeVerify(challenge, code.trim());
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: `Email змінено на ${res.email}` });
    onUserUpdated({ ...user, email: res.email });
    setOpen(false);
    setChallenge(null);
    setCode("");
    setEm("");
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Email</div>
      <div className="p-block__body cabinet-security">
        <div className="cabinet-security__row">
          <span>
            <strong>Email:</strong> {user.email ?? "—"}
          </span>
          <button type="button" className="cabinet-logout" onClick={() => setOpen((v) => !v)}>
            {open ? "Скасувати" : "Змінити email"}
          </button>
        </div>
        {open && (
          <form onSubmit={challenge ? onVerify : onStart} className="cabinet-auth-form">
            <label className="apps-field">
              <span className="apps-field__label">Новий email</span>
              <input
                type="email"
                value={em}
                onChange={(e) => setEm(e.target.value)}
                disabled={!!challenge}
                required
              />
            </label>
            {challenge && (
              <label className="apps-field">
                <span className="apps-field__label">6-значний код з листа</span>
                <input
                  className="cabinet-auth-code"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                />
              </label>
            )}
            {msg && (
              <p
                className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
              >
                {msg.text}
              </p>
            )}
            <button
              type="submit"
              className="portal-cta"
              disabled={busy || (!!challenge && code.length !== 6)}
            >
              {busy ? "Надсилання..." : challenge ? "Підтвердити код" : "Надіслати код"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleBlock({ user }: { user: PublicUser }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const onLink = async () => {
    setBusy(true);
    setMsg(null);
    const res = await googleLinkStart();
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    window.location.href = res.url;
  };

  const onUnlink = async () => {
    setBusy(true);
    setMsg(null);
    const res = await googleUnlink();
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "Google-акаунт відв'язано." });
    window.location.reload();
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Google-акаунт</div>
      <div className="p-block__body cabinet-security">
        <div className="cabinet-security__row">
          <span>
            <strong>Статус:</strong>{" "}
            {user.googleLinked ? "прив'язано" : "не прив'язано"}
          </span>
          {user.googleLinked ? (
            <button type="button" className="cabinet-logout" onClick={() => void onUnlink()} disabled={busy}>
              {busy ? "..." : "Відв'язати"}
            </button>
          ) : (
            <button type="button" className="cabinet-logout" onClick={() => void onLink()} disabled={busy}>
              {busy ? "..." : "Прив'язати"}
            </button>
          )}
        </div>
        <p className="cabinet-auth-note">
          Google-вхід доступний лише для прив'язаних акаунтів.
        </p>
        {msg && (
          <p
            className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function SessionsBlock() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyToken, setBusyToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await fetchSessions();
    setSessions(items);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRevoke = async (token: string) => {
    setBusyToken(token);
    setMsg(null);
    const res = await revokeSession(token);
    setBusyToken(null);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "Сесію завершено." });
    void load();
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Активні сесії</div>
      <div className="p-block__body cabinet-security">
        {loaded && sessions.length === 0 && (
          <p className="cabinet-auth-note">Активних сесій не знайдено.</p>
        )}
        <ul className="cabinet-sessions">
          {sessions.map((s) => (
            <li
              key={s.token}
              className={`cabinet-sessions__item${s.isCurrent ? " is-current" : ""}`}
            >
              <div className="cabinet-sessions__meta">
                <strong>{s.isCurrent ? "Поточна сесія" : "Інша сесія"}</strong>
                <span className="cabinet-sessions__ua">{s.userAgent ?? "Невідомий пристрій"}</span>
                <span>IP: {s.ip ?? "—"}</span>
                <span>
                  Остання активність:{" "}
                  {s.lastSeen ? new Date(s.lastSeen + "Z").toLocaleString("uk-UA") : "—"}
                </span>
              </div>
              {!s.isCurrent && (
                <button
                  type="button"
                  className="cabinet-logout"
                  disabled={busyToken === s.token}
                  onClick={() => void onRevoke(s.token)}
                >
                  {busyToken === s.token ? "..." : "Завершити"}
                </button>
              )}
            </li>
          ))}
        </ul>
        {msg && (
          <p
            className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function AccountBlock() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);

  const onRequest = async (kind: "export" | "delete") => {
    setBusy(kind);
    setMsg(null);
    const res = await accountRequest(kind);
    setBusy(null);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({
      ok: true,
      text:
        kind === "export"
          ? "Запит на експорт даних надіслано адміністрації."
          : "Запит на видалення акаунта надіслано адміністрації.",
    });
  };

  return (
    <div className="p-block">
      <div className="p-block__head">Дані та акаунт</div>
      <div className="p-block__body cabinet-security">
        <div className="cabinet-security__row">
          <span>Експорт ваших даних</span>
          <button
            type="button"
            className="cabinet-logout"
            onClick={() => void onRequest("export")}
            disabled={busy !== null}
          >
            {busy === "export" ? "..." : "Запит на експорт"}
          </button>
        </div>
        <div className="cabinet-security__row">
          <span>Видалення акаунта</span>
          <button
            type="button"
            className="cabinet-logout"
            onClick={() => void onRequest("delete")}
            disabled={busy !== null}
          >
            {busy === "delete" ? "..." : "Запит на видалення"}
          </button>
        </div>
        {msg && (
          <p
            className={`cabinet-auth-msg ${msg.ok ? "cabinet-auth-msg--ok" : "cabinet-auth-msg--err"}`}
          >
            {msg.text}
          </p>
        )}
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
