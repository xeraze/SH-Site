import { useEffect, useRef } from "react";

const SITE_KEY = "0x4AAAAAAFzibgzYFI9dgjMs";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderParams {
  sitekey: string;
  action: string;
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
}

interface TurnstileInstance {
  render: (container: HTMLElement, params: TurnstileRenderParams) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const finish = () => {
      if (window.turnstile) resolve();
      else reject(new Error("turnstile"));
    };
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileField({
  action,
  onToken,
  onIssue,
}: {
  action: "login" | "register";
  onToken: (token: string | null) => void;
  onIssue: (message: string | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const onIssueRef = useRef(onIssue);
  onTokenRef.current = onToken;
  onIssueRef.current = onIssue;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let widgetId = "";

    const accept = (token: string) => {
      if (cancelled) return;
      onIssueRef.current(null);
      onTokenRef.current(token);
    };
    const expire = () => {
      if (cancelled) return;
      onTokenRef.current(null);
      onIssueRef.current("Перевірка застаріла. Пройдіть її ще раз.");
    };
    const fail = () => {
      if (cancelled) return;
      onTokenRef.current(null);
      onIssueRef.current("Не вдалося пройти перевірку. Спробуйте ще раз.");
    };

    loadTurnstile()
      .then(() => {
        if (cancelled || !hostRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(hostRef.current, {
          sitekey: SITE_KEY,
          action,
          size: "flexible",
          callback: accept,
          "expired-callback": expire,
          "error-callback": fail,
          "timeout-callback": fail,
        });
      })
      .catch(() => fail());

    return () => {
      cancelled = true;
      onTokenRef.current(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action]);

  return <div ref={hostRef} className="cabinet-turnstile" />;
}
