import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getToken, submitApplication } from "../api";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import { APPLICATION_FORMS } from "../data/forms";
import { AppointmentBookingForm } from "./AppointmentBookingPage";
import "./Applications.css";

const FORM_TYPES = [
  { id: "job", title: "Заявка на посаду" },
  { id: "appeal", title: "Звернення" },
  { id: "appointment", title: "Запис на прийом" },
];

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const type = FORM_TYPES.find((item) => item.id === params.get("type")) ?? FORM_TYPES[0];
  const [activeId, setActiveId] = useState("appeal");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());
  const active = APPLICATION_FORMS.find((f) => f.id === (type.id === "job" ? "job_application" : activeId))!;

  useEffect(() => {
    renderedAt.current = Date.now();
    setSent(false);
    setError(null);
  }, [type.id, activeId]);

  const notice = useMemo(() => {
    if (error) return { kind: "error" as const, text: error };
    if (sent)
      return {
        kind: "ok" as const,
        text: "Анкету успішно заповнено та надіслано! Очікуйте — статус з'явиться в особистому кабінеті та прийде на пошту (якщо увімкнено в налаштуваннях).",
      };
    return null;
  }, [error, sent]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!getToken()) return;
    setError(null);
    setSending(true);

    const form = e.currentTarget;
    const answers = active.fields
      .map((field) => ({
        field,
        value: ((form.elements.namedItem(field.label) as HTMLInputElement) ?? {}).value ?? "",
      }))
      .filter(({ field, value }) => field.required !== false || value.trim() !== "")
      .map(({ field, value }) => ({ label: field.label, value }));

    const res = await submitApplication(active.id, answers, renderedAt.current);
    setSending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSent(true);
  };

  return (
    <PortalLayout title="Анкети">
      <p className="p-lead">
        Оберіть тип анкети та заповніть її. Усі заповнені анкети розглядаються
        відповідною особою. Статуси заявок на посаду, звернень і записів на прийом
        та діалоги доступні в особистому кабінеті, у розділі «Мої анкети».
      </p>

      <div className="apps-layout">
        <div className="p-block apps-types">
          <div className="p-block__head">Типи анкет</div>
          <ul className="portal-menu">
            {FORM_TYPES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`portal-menu__link apps-types__btn${
                    item.id === type.id ? " portal-menu__link--active" : ""
                  }`}
                  aria-pressed={item.id === type.id}
                  disabled={sending}
                  onClick={() => setParams({ type: item.id })}
                >
                  <span className="portal-menu__marker" aria-hidden="true">▸</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {type.id === "appointment" ? (
          <AppointmentBookingForm />
        ) : (
          <div className="p-block apps-form">
            <div className="p-block__head p-block__head--teal">{type.title}</div>
            <div className="p-block__body">
              {type.id === "appeal" && (
                <label className="apps-field">
                  <span className="apps-field__label">Тема звернення</span>
                  <select value={activeId} disabled={sending} onChange={(e) => setActiveId(e.target.value)}>
                    {APPLICATION_FORMS.filter((form) => form.id !== "job_application").map((form) => (
                      <option key={form.id} value={form.id}>{form.title}</option>
                    ))}
                  </select>
                </label>
              )}
              <p className="apps-form__desc">{active.description}</p>
              {!getToken() && (
                <div className="apps-form__notice">
                  <strong>Потрібен вхід</strong>
                  <p>Щоб надіслати анкету, <Link to="/kabinet">увійдіть або зареєструйтеся</Link>.</p>
                </div>
              )}
              {notice ? (
                <div className={`apps-form__notice${notice.kind === "error" ? " apps-form__notice--error" : ""}`} role="status">
                  <strong>{notice.kind === "error" ? "Помилка!" : "Дякуємо! Анкету надіслано."}</strong>
                  <p>{notice.text}</p>
                  <button
                    type="button"
                    className="portal-cta apps-form__back"
                    onClick={() => {
                      renderedAt.current = Date.now();
                      setSent(false);
                      setError(null);
                    }}
                  >
                    Заповнити ще раз
                  </button>
                </div>
              ) : (
                <form key={active.id} onSubmit={onSubmit} className="apps-form__fields">
                  {active.fields.map((field) => (
                    <label key={field.label} className="apps-field">
                      <span className="apps-field__label">
                        {field.label}
                        {field.required && <em>*</em>}
                      </span>
                      {field.multiline ? (
                        <textarea name={field.label} rows={4} placeholder={field.placeholder} required={field.required} maxLength={2000} />
                      ) : field.options ? (
                        <select name={field.label} required={field.required} defaultValue="">
                          <option value="" disabled>Оберіть варіант</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <input type="text" name={field.label} placeholder={field.placeholder} required={field.required} maxLength={300} />
                      )}
                    </label>
                  ))}
                  <button type="submit" className="portal-cta apps-form__submit" disabled={sending || !getToken()}>
                    {sending ? "Надсилання..." : "Надіслати"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
