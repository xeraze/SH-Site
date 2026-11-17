import { useRef, useState } from "react";
import { createAppointment, getToken } from "../api";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import "./Applications.css";

export function AppointmentBookingForm() {
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const renderedAt = useRef(Date.now());

  const authed = Boolean(getToken());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authed) return;
    setBusy(true);
    setMsg(null);
    const res = await createAppointment(body.trim(), date, renderedAt.current);
    setBusy(false);
    if (!res.ok) {
      setMsg({ kind: "error", text: res.error });
      return;
    }
    setBody("");
    setDate("");
    renderedAt.current = Date.now();
    setMsg({
      kind: "ok",
      text: "Запит надіслано. Очікуйте дзвінка кол-центру. Статус і діалог будуть доступні в особистому кабінеті, у розділі «Мої анкети».",
    });
  };

  return (
    <div className="p-block apps-form">
      <div className="p-block__head p-block__head--teal">Запис на прийом</div>
      <div className="p-block__body">
        <p className="apps-form__desc">
          Опишіть скарги та бажану дату — оператор кол-центру зателефонує для
          підтвердження.
        </p>
        {!authed && (
          <div className="apps-form__notice">
            <strong>Потрібен вхід</strong>
            <p>
              Щоб подати запит на запис, увійдіть у{" "}
              <Link to="/kabinet?tab=apps">особистий кабінет</Link>.
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
              className={`apps-form__notice${msg.kind === "error" ? " apps-form__notice--error" : ""}`}
              role="status"
            >
              <p>{msg.text}</p>
            </div>
          )}
          <button type="submit" className="portal-cta apps-form__submit" disabled={busy || !authed}>
            {busy ? "Надсилання..." : "Надіслати запит"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppointmentBookingPage() {
  return (
    <PortalLayout title="Запис на прийом">
      <p className="p-lead">
        Опишіть скарги та бажану дату — оператор кол-центру зателефонує для
        підтвердження.
      </p>
      <AppointmentBookingForm />
      <p className="p-lead">
        Це один із трьох типів анкет порталу. Усі типи зібрані на сторінці{" "}
        <Link to="/forms">«Анкети»</Link>.
      </p>
    </PortalLayout>
  );
}
