import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--color-ink-soft)", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
          Перевіряємо сесію…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
