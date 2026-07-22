import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Авторизація порталу для лікарів.
 *
 * ВАЖЛИВО: усі функції нижче звертаються до Cloudflare Worker API.
 * Жодна перевірка коду чи пароля не відбувається на клієнті — фронтенд
 * лише відправляє запити та зберігає токен сесії, виданий Worker'ом.
 * Це зроблено навмисно: людина не може підробити авторизацію через
 * консоль браузера, бо логіки перевірки в браузері просто немає.
 *
 * Замініть WORKER_URL на адресу вашого розгорнутого Cloudflare Worker.
 */
const WORKER_URL = import.meta.env.VITE_AUTH_WORKER_URL ?? "https://slobidska-auth.YOUR-SUBDOMAIN.workers.dev";

const SESSION_KEY = "slobidska_portal_session";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  doctorName: string | null;
  requestCode: (discordId: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (discordId: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [doctorName, setDoctorName] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    // Перевіряємо валідність токена на сервері при завантаженні
    fetch(`${WORKER_URL}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid session");
        const data = await res.json();
        setIsAuthenticated(true);
        setDoctorName(data.name ?? null);
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function requestCode(discordId: string) {
    try {
      const res = await fetch(`${WORKER_URL}/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? "Не вдалося надіслати код" };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Немає з'єднання з сервером авторизації" };
    }
  }

  async function verifyCode(discordId: string, code: string) {
    try {
      const res = await fetch(`${WORKER_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.error ?? "Невірний код" };
      }
      const data = await res.json();
      sessionStorage.setItem(SESSION_KEY, data.token);
      setIsAuthenticated(true);
      setDoctorName(data.name ?? null);
      return { ok: true };
    } catch {
      return { ok: false, error: "Немає з'єднання з сервером авторизації" };
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setDoctorName(null);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, doctorName, requestCode, verifyCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
