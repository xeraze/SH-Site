import { useEffect, useMemo, useRef, useState } from "react";
import { loginUrl, submitApplication } from "../api";
import { PortalLayout } from "../components/PortalLayout";
import { APPLICATION_FORMS } from "../data/forms";
import "./ApplicationsPage.css";

export function ApplicationsPage() {
  const [activeId, setActiveId] = useState<string>(APPLICATION_FORMS[0].id);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderedAt = useRef(Date.now());
  const active = APPLICATION_FORMS.find((f) => f.id === activeId)!;

  useEffect(() => {
    renderedAt.current = Date.now();
  }, [activeId]);

  const notice = useMemo(() => {
    if (error) return { kind: "error" as const, text: error };
    if (sent)
      return {
        kind: "ok" as const,
        text: "Заявку успішно надіслано! Очікуйте — статус з'явиться в особистому кабінеті та прийде на пошту (якщо увімкнено в налаштуваннях).",
      };
    return null;
  }, [error, sent]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    const form = e.currentTarget;
    const answers = active.fields.map((field) => ({
      label: field.label,
      value: ((form.elements.namedItem(field.label) as HTMLInputElement) ?? {}).value ?? "",
    }));

    const res = await submitApplication(activeId, answers, renderedAt.current);
    setSending(false);

    if (!res.ok) {
      if (res.error.includes("авторизація")) {
        window.location.href = loginUrl();
        return;
      }
      setError(res.error);
      return;
    }
    setSent(true);
  };

  return (
    <PortalLayout title="Заявки та звернення">
      <p className="p-lead">
        Оберіть тип звернення та заповніть форму. Усі заявки розглядаються
        адміністрацією проєкту. Для відстеження статусу увійдіть у
        особистий кабінет.
      </p>

      <div className="apps-layout">
        <div className="p-block apps-types">
          <div className="p-block__head">Типи звернень</div>
          <ul className="portal-menu">
            {APPLICATION_FORMS.map((form) => (
              <li key={form.id}>
                <button
                  type="button"
                  className={`portal-menu__link apps-types__btn${
                    form.id === activeId ? " portal-menu__link--active" : ""
                  }`}
                  onClick={() => {
                    setActiveId(form.id);
                    setSent(false);
                    setError(null);
                  }}
                >
                  <span className="portal-menu__marker" aria-hidden="true">
                    ▸
                  </span>
                  {form.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-block apps-form">
          <div className="p-block__head p-block__head--teal">{active.title}</div>
          <div className="p-block__body">
            <p className="apps-form__desc">{active.description}</p>

            {notice ? (
              <div
                className={`apps-form__notice${
                  notice.kind === "error" ? " apps-form__notice--error" : ""
                }`}
              >
                <strong>
                  {notice.kind === "error" ? "Помилка!" : "Дякуємо! Форму заповнено."}
                </strong>
                <p>{notice.text}</p>
                <button
                  type="button"
                  className="portal-cta apps-form__back"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                  }}
                >
                  Заповнити ще раз
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="apps-form__fields">
                {active.fields.map((field) => (
                  <label key={field.label} className="apps-field">
                    <span className="apps-field__label">
                      {field.label}
                      {field.required && <em>*</em>}
                    </span>
                    {field.multiline ? (
                      <textarea
                        name={field.label}
                        rows={4}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={2000}
                      />
                    ) : (
                      <input
                        type="text"
                        name={field.label}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={300}
                      />
                    )}
                  </label>
                ))}
                <button
                  type="submit"
                  className="portal-cta apps-form__submit"
                  disabled={sending}
                >
                  {sending ? "Надсилання..." : "Надіслати заявку"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
