import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { fetchMe, getToken } from "../api";
import { ROLE_LABELS_UI } from "../data/roles";
import "./Onboarding.css";

type TourKind = "guest" | "patient" | "staff";

const FLAG_KEY = "sh.onboarding.v1";
const ROLES_KEY = "sh.onboarding.roles";

interface TourStep {
  icon: string;
  title: string;
  body: string;
}

const TOUR_STEPS: Record<TourKind, TourStep[]> = {
  guest: [
    {
      icon: "mdi:hospital-building",
      title: "Ласкаво просимо до Sloboda Hospital",
      body: "Кілька кроків, щоб зрозуміти, куди йти: де шукати роботу, як записатися до лікаря та де дивитися документи лікарні.",
    },
    {
      icon: "mdi:briefcase-outline",
      title: "Де шукати роботу",
      body: "Розділ «Заявки» — оберіть тип «Заявка на посаду» та заповніть форму. Статус заявки з'явиться у кабінеті та прийде на пошту. Відповіді на уточнення — у діалозі заявки.",
    },
    {
      icon: "mdi:calendar-check-outline",
      title: "Як записатися до лікаря",
      body: "Сторінка «Запис на прийом»: оберіть відділення, лікаря та час. Потрібен вхід у кабінет — реєстрація займає хвилину, код приходить на пошту (діє 10 хвилин).",
    },
    {
      icon: "mdi:file-document-multiple-outline",
      title: "Оголошення та документи",
      body: "«Оголошення» — актуальні новини лікарні, старі зберігаються в архіві. «Документація» — нормативні документи, положення та інструкції, які можна переглянути й завантажити.",
    },
    {
      icon: "mdi:account-circle-outline",
      title: "Особистий кабінет",
      body: "Кнопка «Кабінет» у шапці: профіль, статуси заявок і записів, налаштування сповіщень. Заповніть профіль після реєстрації — і з вами зможемо зв'язатися.",
    },
  ],
  patient: [
    {
      icon: "mdi:account-circle-outline",
      title: "Ваш особистий кабінет",
      body: "Тут ваш профіль (ПІБ, аватар, вік, про себе), статуси поданих заявок і звернень, а також налаштування сповіщень на пошту.",
    },
    {
      icon: "mdi:calendar-clock",
      title: "Записи на прийом",
      body: "Записи, статуси та діалог із кол-центром — у кабінеті. Якщо виникло уточнення, відповідайте просто в діалозі запису.",
    },
    {
      icon: "mdi:email-outline",
      title: "Звернення та заявки",
      body: "Форми — у розділі «Заявки»: звернення, скарги, пропозиції та заявка на посаду. До форми можна прикріпити файли, відповіді приходять у кабінет і на пошту.",
    },
  ],
  staff: [
    {
      icon: "mdi:view-dashboard-outline",
      title: "Панель працівника",
      body: "Кнопка «Панель» у шапці. Звернення та заявки на посаду, кол-центр із записами, робота в діалогах — усе за вашими правами.",
    },
    {
      icon: "mdi:bullhorn-outline",
      title: "Оголошення, документація, архів",
      body: "Вкладки «Оголошення» та «Документація» — створення і редагування матеріалів. Вкладка «Архів» — архівування та повернення оголошень і документів.",
    },
    {
      icon: "mdi:account-key-outline",
      title: "Управління посадами",
      body: "Вкладка «Управління» — видача та зняття посад за email: зареєстрованому користувачеві одразу, новому — через запрошення. Ролі та спеціалізація працівника — у розробці.",
    },
    {
      icon: "mdi:shield-cog-outline",
      title: "Адміністрування та журнал",
      body: "Для адміністраторів: таблиця користувачів (IP, країна, пристрій, сесії), попередження й блокування, а також журнал дій за всіма розділами.",
    },
  ],
};

const ROLE_PERKS: Record<string, string> = {
  employee: "Статус працівника лікарні: профіль із спеціалізацією та доступ до внутрішніх матеріалів.",
  operator: "Кол-центр: робота із записами на прийом і зверненнями пацієнтів.",
  department_head: "Керування відділенням і розгляд звернень за напрямом.",
  executive_secretary: "Робота з документами та офіційним листуванням лікарні.",
  deputy_director: "Розгляд заявок, звернень і керівництво напрямами роботи лікарні.",
  med_director: "Медичне керівництво: заявки, звернення та рішення щодо медичних питань.",
  main_director: "Керівництво лікарнею: заявки, звернення та стратегічні рішення.",
  sysadmin: "Повний адміністративний доступ: користувачі, налаштування, журнал дій.",
};

function readFlags(): Partial<Record<TourKind, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeFlag(kind: TourKind): void {
  const flags = readFlags();
  flags[kind] = true;
  localStorage.setItem(FLAG_KEY, JSON.stringify(flags));
}

function readRoleSnapshot(): string[] | null {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function OnboardingTour() {
  const [view, setView] = useState<"congrats" | "tour" | null>(null);
  const [kind, setKind] = useState<TourKind>("guest");
  const [step, setStep] = useState(0);
  const [newRoles, setNewRoles] = useState<string[]>([]);

  useEffect(() => {
    const first = readRoleSnapshot() === null;
    const apply = (roles: string[]) => {
      const prev = readRoleSnapshot() ?? [];
      const nextKind: TourKind = !getToken()
        ? "guest"
        : roles.some((r) => r !== "patient")
          ? "staff"
          : "patient";
      localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
      const added = first
        ? []
        : roles.filter((r) => r !== "patient" && !prev.includes(r));
      setKind(nextKind);
      setStep(0);
      if (added.length > 0) {
        setNewRoles(added);
        setView("congrats");
      } else if (!readFlags()[nextKind]) {
        setView("tour");
      }
    };

    if (!getToken()) {
      apply([]);
      return;
    }
    void fetchMe().then((me) => apply(me?.roles ?? []));
  }, []);

  if (view === "congrats") {
    return (
      <div className="tour-overlay" role="dialog" aria-modal="true">
        <div className="tour-card tour-card--congrats">
          <Icon icon="mdi:party-popper" width={40} height={40} />
          <h3 className="tour-title">Вітаємо з новою посадою!</h3>
          <ul className="tour-perks">
            {newRoles.map((r) => (
              <li key={r}>
                <strong>{ROLE_LABELS_UI[r] ?? r}</strong> — {ROLE_PERKS[r] ?? "Нові можливості в системі."}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="tour-btn tour-btn--primary"
            onClick={() => setView(readFlags()[kind] ? null : "tour")}
          >
            Зрозуміло
          </button>
        </div>
      </div>
    );
  }

  if (view !== "tour") return null;

  const steps = TOUR_STEPS[kind];
  const current = steps[Math.min(step, steps.length - 1)];
  const last = step >= steps.length - 1;

  const finish = () => {
    writeFlag(kind);
    setView(null);
  };

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true">
      <div className="tour-card">
        <div className="tour-head">
          <Icon icon={current.icon} width={30} height={30} />
          <span className="tour-kind">
            {kind === "guest" ? "Путівник для гостя" : kind === "patient" ? "Путівник пацієнта" : "Путівник працівника"}
          </span>
          <button type="button" className="tour-close" aria-label="Закрити" onClick={finish}>
            ×
          </button>
        </div>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-body">{current.body}</p>
        <div className="tour-dots">
          {steps.map((s, i) => (
            <span key={s.title} className={i === step ? "is-on" : ""} />
          ))}
        </div>
        <div className="tour-actions">
          <button
            type="button"
            className="tour-btn"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Назад
          </button>
          <button type="button" className="tour-btn tour-btn--ghost" onClick={finish}>
            Пропустити
          </button>
          {last ? (
            <button type="button" className="tour-btn tour-btn--primary" onClick={finish}>
              Готово
            </button>
          ) : (
            <button
              type="button"
              className="tour-btn tour-btn--primary"
              onClick={() => setStep((s) => s + 1)}
            >
              Далі
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
