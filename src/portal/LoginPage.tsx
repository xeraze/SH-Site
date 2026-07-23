import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

type Step = "id" | "code";

export function LoginPage() {
  const { requestCode, verifyCode } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("id");
  const [discordId, setDiscordId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!discordId.trim()) {
      setError("Введіть ваш Discord ID");
      return;
    }
    setIsSubmitting(true);
    const result = await requestCode(discordId.trim());
    setIsSubmitting(false);
    if (result.ok) {
      setStep("code");
    } else {
      setError(result.error ?? "Не вдалося надіслати код");
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Введіть код із Discord");
      return;
    }
    setIsSubmitting(true);
    const result = await verifyCode(discordId.trim(), code.trim());
    setIsSubmitting(false);
    if (result.ok) {
      navigate("/portal/dashboard");
    } else {
      setError(result.error ?? "Невірний код");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src="/SH-Site/emblem.png" alt="Герб" className="login-card__emblem" />
          <div>
            <span className="eyebrow">Портал для лікарів</span>
            <h1>Вхід до системи</h1>
          </div>
        </div>

        {step === "id" && (
          <form onSubmit={handleRequestCode} className="login-form">
            <p className="login-form__hint">
              Введіть ваш Discord ID. Якщо він числиться серед допущеного
              персоналу, ми надішлемо одноразовий код у приватний канал
              лікарні на Discord-сервері.
            </p>
            <label className="login-field">
              <span>Discord ID</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Напр. 123456789012345678"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                autoFocus
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn--primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Надсилаємо…" : "Отримати код"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="login-form">
            <p className="login-form__hint">
              Код надіслано в канал <strong>#вхід-у-систему</strong> на
              Discord-сервері лікарні. Введіть його нижче — код дійсний
              протягом 5 хвилин.
            </p>
            <label className="login-field">
              <span>Код підтвердження</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                className="login-field__code"
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn--primary login-submit" disabled={isSubmitting}>
              {isSubmitting ? "Перевіряємо…" : "Увійти"}
            </button>
            <button
              type="button"
              className="login-back"
              onClick={() => {
                setStep("id");
                setCode("");
                setError(null);
              }}
            >
              ← Змінити Discord ID
            </button>
          </form>
        )}
      </div>
    </div>
  );
}