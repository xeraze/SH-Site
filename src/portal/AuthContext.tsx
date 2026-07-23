import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const WORKER_URL = import.meta.env.VITE_AUTH_WORKER_URL ?? "https://sh-site.xeraze-official.workers.dev";

const SESSION_KEY = "slobidska_portal_session";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  discordId: string | null;
  requestCode: (discordId: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (discordId: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [discordId, setDiscordId] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${WORKER_URL}/session-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("invalid session");
        const data = await res.json();
        setIsAuthenticated(true);
        setDiscordId(data.session?.discordId ?? null);
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_KEY);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function requestCode(discordIdInput: string) {
    try {
      const res = await fetch(`${WORKER_URL}/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: discordIdInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error ?? "Не вдалося надіслати код" };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Немає з'єднання з сервером авторизації" };
    }
  }

  async function verifyCode(discordIdInput: string, code: string) {
    try {
      const res = await fetch(`${WORKER_URL}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: discordIdInput, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error ?? "Невірний код" };
      }
      sessionStorage.setItem(SESSION_KEY, data.token);
      setIsAuthenticated(true);
      setDiscordId(discordIdInput);
      return { ok: true };
    } catch {
      return { ok: false, error: "Немає з'єднання з сервером авторизації" };
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setDiscordId(null);
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, discordId, requestCode, verifyCode, logout }}
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