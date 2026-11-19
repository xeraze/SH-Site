import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { fetchMeResult, getToken } from "../api";
import { ROLE_LABELS_UI } from "../data/status";
import { RESTART_EVENT } from "./tourRestart";
import "./Navigator.css";

type TourKind = "guest" | "patient" | "staff";

const FLAG_KEY = "sh.onboarding.v1";
const ROLES_KEY = "sh.onboarding.roles";

interface TourStep {
  icon: string;
  target: string;
  title: string;
  body: string;
}

const TAB_FORMS = '.site-header__tabs a[href$="/forms"]';
const TAB_DOCS = '.site-header__tabs a[href$="/documentation"]';
const TAB_PATIENTS = '.site-header__tabs a[href$="/for-patients"]';

const TOUR_STEPS: Record<TourKind, TourStep[]> = {
  guest: [
    {
      icon: "mdi:hospital-building",
      target: ".site-header__brand",
      title: "Ласкаво просимо до Слобідської ЦРЛ!",
      body: "Офіційний портал лікарні гри, розробленої на платформі Roblox. Відділення, документи та оголошення можна переглядати без реєстрації — просто користуйтеся меню та пошуком у шапці.",
    },
    {
      icon: "mdi:briefcase-outline",
      target: TAB_FORMS,
      title: "Як подати заявку на посаду?",
      body: "Виберіть розділ «Анкети» й заповніть анкету «Заявка на посаду». Але подавати анкети можуть лише зареєстровані користувачі: для гостя на будь-яке таке питання одна відповідь — спочатку реєстрація (потрібен лише email і пароль).",
    },
    {
      icon: "mdi:calendar-check-outline",
      target: TAB_FORMS,
      title: "Як записатися до лікаря?",
      body: "Відкрийте розділ «Анкети» й оберіть тип «Запис на прийом»: опишіть скарги та бажану дату. Як і заявки на посаду чи звернення, запис доступний після реєстрації - гість може лише переглядати інформацію.",
    },
    {
      icon: "mdi:file-document-multiple-outline",
      target: TAB_DOCS,
      title: "Документи та оголошення",
      body: "«Документація» — нормативні документи, положення та інструкції, які можна завантажити. «Оголошення» — актуальні новини від керівництва лікарні.",
    },
  ],
  patient: [
    {
      icon: "mdi:account-circle-outline",
      target: ".site-header__menu-btn",
      title: "Особистий кабінет",
      body: "Тут ваш профіль (ПІБ, аватар, про себе), статуси заповнених анкет а також налаштування. Відкривається через кнопку меню у шапці.",
    },
    {
      icon: "mdi:file-document-edit-outline",
      target: TAB_FORMS,
      title: "Анкети",
      body: "Три типи анкет: звернення (скарги та пропозиції), заявка на посаду та запис на прийом. Оберіть тип, заповніть і надішліть — статус заповненої анкети з'явиться у кабінеті та прийде на пошту. Відповіді на уточнення — у діалозі анкети.",
    },
    {
      icon: "mdi:file-document-multiple-outline",
      target: TAB_DOCS,
      title: "Документація та оголошення",
      body: "Нормативні документи, положення та інструкції — можна переглянути й завантажити собі на пристрій. «Оголошення» — актуальні новини та повідомлення від керівництва лікарні.",
    },
    {
      icon: "mdi:magnify",
      target: ".site-header__search",
      title: "Пошук по сайту",
      body: "Знайдіть відділення, лікаря, документ або розділ — прямо з шапки, не заходячи по кожному пункту окремо.",
    },
    {
      icon: "mdi:heart-outline",
      target: TAB_PATIENTS,
      title: "Для пацієнтів",
      body: "НСЗУ та відповіді на часті питання. Також тут є кнопка «Пройти путівник ще раз», щоб повторити його, коли захочете.",
    },
  ],
  staff: [],
};

const ROLE_PERKS: Record<string, string> = {
  employee: "Статус «Працівник лікарні»: профіль із спеціалізацією та доступ до внутрішніх матеріалів.",
  operator: "Кол-центр: робота із записами на прийом і зверненнями пацієнтів.",
  department_head: "Керування відділенням і розгляд звернень за напрямом.",
  deputy_director: "Розгляд заявок, звернень і керівництво напрямами роботи лікарні.",
  med_director: "Медичне керівництво: заявки, звернення та рішення щодо медичних питань.",
  main_director: "Керівництво лікарнею: заявки, звернення та стратегічні рішення.",
  sysadmin: "Повний адміністративний доступ: користувачі, налаштування, журнал дій.",
};

interface Spot {
  top: number;
  left: number;
  width: number;
  height: number;
}

function readFlags(): Partial<Record<TourKind, boolean>> {
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeFlag(kind: TourKind): void {
  if (kind === "staff") return;
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
  const [spot, setSpot] = useState<Spot | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [cardH, setCardH] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

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
      } else if (nextKind !== "staff" && !readFlags()[nextKind]) {
        setView("tour");
      }
    };

    if (!getToken()) {
      apply([]);
      return;
    }
    void fetchMeResult().then((res) => {
      if (res.ok) apply(res.user?.roles ?? []);
    });
  }, []);

  useEffect(() => {
    const onRestart = () => {
      setKind(getToken() ? "patient" : "guest");
      setStep(0);
      setView("tour");
    };
    window.addEventListener(RESTART_EVENT, onRestart);
    return () => window.removeEventListener(RESTART_EVENT, onRestart);
  }, []);

  useEffect(() => {
    if (view !== "tour") return;
    const measure = () => {
      const steps = TOUR_STEPS[kind];
      const current = steps[Math.min(step, steps.length - 1)];
      const el = current ? document.querySelector(current.target) : null;
      const r = el?.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setSpot(null);
      }
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.scrollTo(0, 0);
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [view, kind, step]);

  useEffect(() => {
    if (view !== "tour" || !cardRef.current) return;
    const h = cardRef.current.offsetHeight;
    if (h > 0 && Math.abs(h - cardH) > 1) setCardH(h);
  }, [view, kind, step, spot, cardH]);

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
            onClick={() =>
              setView(kind !== "staff" && !readFlags()[kind] ? "tour" : null)
            }
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

  const cardW = Math.min(340, Math.max(240, viewport.w - 24));
  const estH = cardH || 320;
  let cardStyle: CSSProperties;
  if (spot) {
    const left = Math.min(
      Math.max(12, spot.left + spot.width / 2 - cardW / 2),
      Math.max(12, viewport.w - cardW - 12),
    );
    let top: number;
    if (spot.top + spot.height + 16 + estH <= viewport.h - 8) {
      top = spot.top + spot.height + 16;
    } else if (spot.top - 16 - estH >= 8) {
      top = spot.top - 16 - estH;
    } else {
      top = Math.max(8, (viewport.h - estH) / 2);
    }
    cardStyle = { left, top, width: cardW };
  } else {
    cardStyle = {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: cardW,
    };
  }

  return (
    <div className="tour-overlay tour-overlay--tour" role="dialog" aria-modal="true">
      <div
        className={`tour-spot${spot ? "" : " tour-spot--full"}`}
        style={
          spot
            ? { top: spot.top, left: spot.left, width: spot.width, height: spot.height }
            : undefined
        }
      >
        {spot && <span className="tour-spot__mark">!</span>}
      </div>
      <div className="tour-card tour-card--float" ref={cardRef} style={cardStyle}>
        <div className="tour-head">
          <Icon icon={current.icon} width={30} height={30} />
          <span className="tour-kind">
            {kind === "guest" ? "Путівник для гостя" : "Путівник пацієнта"}
          </span>
          <button type="button" className="tour-close" aria-label="Закрити" onClick={finish}>
            ×
          </button>
        </div>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-body">{current.body}</p>
        <div className="tour-dots">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={i === Math.min(step, steps.length - 1) ? "is-on" : ""}
            />
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
