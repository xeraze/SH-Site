import { useRef, useState } from "react";
import { createAppointment, getToken, loginUrl } from "../api";
import { PortalLayout } from "../components/PortalLayout";
import "./ApplicationsPage.css";

export function AppointmentBookingPage() {
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const renderedAt = useRef(Date.now());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getToken()) {
      setMsg({ ok: false, text: "Увійдіть у кабінет, щоб подати запит на запис." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await createAppointment(body.trim(), date, renderedAt.current);
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setBody("");
    setDate("");
    setMsg({
      ok: true,
      text: "Запит надіслано. Очікуйте дзвінка кол-центру. Статус з'явиться в особистому кабінеті.",
    });
  };

  return (
    <PortalLayout title="Запис на прийом">
      <p className="p-lead">
        Опишіть скарги та бажану дату — оператор кол-центру зателефонує для
        підтвердження.
      </p>

      <div className="p-block apps-form">
        <div className="p-block__head p-block__head--teal">Запит на запис</div>
        <div className="p-block__body">
          {!getToken() && (
            <div className="apps-form__notice">
              <strong>Потрібен вхід</strong>
              <p>
                Щоб подати запит на запис, увійдіть у{" "}
                <a href={loginUrl("/zapys-na-pryiom")}>особистий кабінет</a>.
              </p>
            </div>
          )}
          <form onSubmit={onSubmit} className="apps-form__fields">
            <label className="apps-field">
              <span className="apps-field__label">
                Скарги, бажаний лікар або відділення<em>*</em>
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Опишіть симптоми або бажаного лікаря..."
                maxLength={2000}
                rows={4}
                required
              />
            </label>
            <label className="apps-field">
              <span className="apps-field__label">
                Бажана дата<em>*</em>
              </span>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                max={`${new Date().getFullYear()}-12-31`}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            {msg && (
              <div
                className={`apps-form__notice${msg.ok ? "" : " apps-form__notice--error"}`}
              >
                <p>{msg.text}</p>
              </div>
            )}
            <button
              type="submit"
              className="portal-cta apps-form__submit"
              disabled={busy || !getToken()}
            >
              {busy ? "Надсилання..." : "Надіслати запит"}
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
